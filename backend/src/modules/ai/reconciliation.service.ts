import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { Contract } from '../../entities/contract.entity';
import { Invoice } from '../../entities/invoice.entity';
import { DiscrepancyType, DiscrepancyPriority } from '../../entities/reconciliation-report.entity';

export interface ReconciliationResult {
  hasDiscrepancies: boolean;
  totalDiscrepancyAmount: number;
  discrepancies: {
    type: DiscrepancyType;
    priority: DiscrepancyPriority;
    description: string;
    expectedValue: any;
    actualValue: any;
    amount: number;
    lineItemIndex?: number;
  }[];
  checklist: {
    item: string;
    passed: boolean;
    details: string;
    confidence: number;
  }[];
  rationaleText?: string;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private aiService: AiService) {}

  async reconcileInvoiceWithContract(
    invoice: Invoice,
    contract: Contract,
  ): Promise<ReconciliationResult> {
    const checklist = this.buildChecklist(contract);
    const discrepancies: ReconciliationResult['discrepancies'] = [];
    let totalDiscrepancyAmount = 0;

    for (const check of checklist) {
      const result = await this.performCheck(check, invoice, contract);
      check.passed = result.passed;
      check.details = result.details;
      check.confidence = result.confidence;

      if (!result.passed && result.discrepancy) {
        discrepancies.push(result.discrepancy);
        totalDiscrepancyAmount += result.discrepancy.amount;
      }
    }

    const hasDiscrepancies = discrepancies.length > 0;
    
    const rationaleText = hasDiscrepancies
      ? await this.generateRationale(discrepancies, checklist)
      : 'Invoice matches contract terms without discrepancies.';

    return {
      hasDiscrepancies,
      totalDiscrepancyAmount,
      discrepancies,
      checklist,
      rationaleText,
    };
  }

  private buildChecklist(contract: Contract): ReconciliationResult['checklist'] {
    const checklist: ReconciliationResult['checklist'] = [];

    if (contract.terms?.rates?.length > 0) {
      checklist.push({
        item: 'Rate Compliance',
        passed: false,
        details: '',
        confidence: 0,
      });
    }

    if (contract.terms?.caps?.length > 0) {
      checklist.push({
        item: 'Cap Limits',
        passed: false,
        details: '',
        confidence: 0,
      });
    }

    if (contract.terms?.fees) {
      checklist.push({
        item: 'Authorized Fees',
        passed: false,
        details: '',
        confidence: 0,
      });
    }

    if (contract.terms?.paymentTerms) {
      checklist.push({
        item: 'Payment Terms',
        passed: false,
        details: '',
        confidence: 0,
      });
    }

    checklist.push({
      item: 'Invoice Date Validity',
      passed: false,
      details: '',
      confidence: 0,
    });

    return checklist;
  }

  private async performCheck(
    check: ReconciliationResult['checklist'][0],
    invoice: Invoice,
    contract: Contract,
  ): Promise<{
    passed: boolean;
    details: string;
    confidence: number;
    discrepancy?: ReconciliationResult['discrepancies'][0];
  }> {
    switch (check.item) {
      case 'Rate Compliance':
        return this.checkRateCompliance(invoice, contract);
      
      case 'Cap Limits':
        return this.checkCapLimits(invoice, contract);
      
      case 'Authorized Fees':
        return this.checkAuthorizedFees(invoice, contract);
      
      case 'Payment Terms':
        return this.checkPaymentTerms(invoice, contract);
      
      case 'Invoice Date Validity':
        return this.checkInvoiceDateValidity(invoice, contract);
      
      default:
        return {
          passed: true,
          details: 'Check not implemented',
          confidence: 0.5,
        };
    }
  }

  private checkRateCompliance(
    invoice: Invoice,
    contract: Contract,
  ): {
    passed: boolean;
    details: string;
    confidence: number;
    discrepancy?: ReconciliationResult['discrepancies'][0];
  } {
    const contractRates = contract.terms?.rates || [];
    const discrepantItems: number[] = [];
    let totalOvercharge = 0;

    for (let i = 0; i < invoice.lineItems.length; i++) {
      const item = invoice.lineItems[i];
      const applicableRate = this.findApplicableRate(item.description, contractRates);
      
      if (applicableRate && item.rate > applicableRate.rate) {
        discrepantItems.push(i);
        const overcharge = (item.rate - applicableRate.rate) * item.quantity;
        totalOvercharge += overcharge;
      }
    }

    if (discrepantItems.length > 0) {
      return {
        passed: false,
        details: `${discrepantItems.length} line items exceed contract rates`,
        confidence: 0.9,
        discrepancy: {
          type: DiscrepancyType.RATE_OVERAGE,
          priority: DiscrepancyPriority.HIGH,
          description: `Rate overcharge detected on ${discrepantItems.length} items`,
          expectedValue: 'Contract rates',
          actualValue: 'Higher rates charged',
          amount: totalOvercharge,
        },
      };
    }

    return {
      passed: true,
      details: 'All rates comply with contract',
      confidence: 0.9,
    };
  }

  private checkCapLimits(
    invoice: Invoice,
    contract: Contract,
  ): {
    passed: boolean;
    details: string;
    confidence: number;
    discrepancy?: ReconciliationResult['discrepancies'][0];
  } {
    const caps = contract.terms?.caps || [];
    
    for (const cap of caps) {
      if (cap.type === 'monthly' && invoice.totalAmount > cap.amount) {
        return {
          passed: false,
          details: `Invoice exceeds monthly cap of $${cap.amount}`,
          confidence: 0.95,
          discrepancy: {
            type: DiscrepancyType.MISSING_CAP,
            priority: DiscrepancyPriority.CRITICAL,
            description: 'Monthly spending cap exceeded',
            expectedValue: cap.amount,
            actualValue: invoice.totalAmount,
            amount: invoice.totalAmount - cap.amount,
          },
        };
      }
    }

    return {
      passed: true,
      details: 'Within cap limits',
      confidence: 0.95,
    };
  }

  private checkAuthorizedFees(
    invoice: Invoice,
    contract: Contract,
  ): {
    passed: boolean;
    details: string;
    confidence: number;
    discrepancy?: ReconciliationResult['discrepancies'][0];
  } {
    const authorizedFees = contract.terms?.fees || [];
    const invoiceFees = invoice.fees || [];
    const unauthorizedFees: any[] = [];

    for (const fee of invoiceFees) {
      const isAuthorized = authorizedFees.some(
        authFee => this.feesMatch(fee, authFee),
      );
      
      if (!isAuthorized) {
        unauthorizedFees.push(fee);
      }
    }

    if (unauthorizedFees.length > 0) {
      const totalUnauthorized = unauthorizedFees.reduce(
        (sum, fee) => sum + (fee.type === 'percent' ? invoice.subtotal * fee.amount / 100 : fee.amount),
        0,
      );

      return {
        passed: false,
        details: `${unauthorizedFees.length} unauthorized fees detected`,
        confidence: 0.85,
        discrepancy: {
          type: DiscrepancyType.UNAUTHORIZED_FEE,
          priority: DiscrepancyPriority.HIGH,
          description: 'Unauthorized fees charged',
          expectedValue: 'Only authorized fees',
          actualValue: unauthorizedFees.map(f => f.description).join(', '),
          amount: totalUnauthorized,
        },
      };
    }

    return {
      passed: true,
      details: 'All fees are authorized',
      confidence: 0.85,
    };
  }

  private checkPaymentTerms(
    invoice: Invoice,
    contract: Contract,
  ): {
    passed: boolean;
    details: string;
    confidence: number;
    discrepancy?: ReconciliationResult['discrepancies'][0];
  } {
    const paymentTerms = contract.terms?.paymentTerms;
    if (!paymentTerms || !invoice.dueDate) {
      return {
        passed: true,
        details: 'Payment terms not specified',
        confidence: 0.7,
      };
    }

    const invoiceDate = new Date(invoice.invoiceDate);
    const dueDate = new Date(invoice.dueDate);
    const daysDiff = Math.floor((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (paymentTerms.netDays && daysDiff < paymentTerms.netDays) {
      return {
        passed: false,
        details: `Due date violates Net ${paymentTerms.netDays} terms`,
        confidence: 0.9,
        discrepancy: {
          type: DiscrepancyType.OTHER,
          priority: DiscrepancyPriority.MEDIUM,
          description: 'Payment terms violation',
          expectedValue: `Net ${paymentTerms.netDays}`,
          actualValue: `Net ${daysDiff}`,
          amount: 0,
        },
      };
    }

    return {
      passed: true,
      details: 'Payment terms compliant',
      confidence: 0.9,
    };
  }

  private checkInvoiceDateValidity(
    invoice: Invoice,
    contract: Contract,
  ): {
    passed: boolean;
    details: string;
    confidence: number;
    discrepancy?: ReconciliationResult['discrepancies'][0];
  } {
    const invoiceDate = new Date(invoice.invoiceDate);
    const effectiveDate = new Date(contract.effectiveDate);
    const endDate = contract.endDate ? new Date(contract.endDate) : null;

    if (invoiceDate < effectiveDate) {
      return {
        passed: false,
        details: 'Invoice dated before contract effective date',
        confidence: 1,
        discrepancy: {
          type: DiscrepancyType.DATE_MISMATCH,
          priority: DiscrepancyPriority.CRITICAL,
          description: 'Invoice predates contract',
          expectedValue: `After ${contract.effectiveDate}`,
          actualValue: invoice.invoiceDate,
          amount: 0,
        },
      };
    }

    if (endDate && invoiceDate > endDate) {
      return {
        passed: false,
        details: 'Invoice dated after contract expiration',
        confidence: 1,
        discrepancy: {
          type: DiscrepancyType.DATE_MISMATCH,
          priority: DiscrepancyPriority.CRITICAL,
          description: 'Invoice after contract expiration',
          expectedValue: `Before ${contract.endDate}`,
          actualValue: invoice.invoiceDate,
          amount: invoice.totalAmount,
        },
      };
    }

    return {
      passed: true,
      details: 'Invoice date within contract period',
      confidence: 1,
    };
  }

  private findApplicableRate(description: string, rates: any[]): any {
    const normalizedDesc = description.toLowerCase();
    return rates.find(rate => {
      const rateDesc = (rate.description || '').toLowerCase();
      return normalizedDesc.includes(rateDesc) || rateDesc.includes(normalizedDesc);
    });
  }

  private feesMatch(invoiceFee: any, contractFee: any): boolean {
    const descMatch = invoiceFee.description.toLowerCase().includes(contractFee.description.toLowerCase()) ||
                     contractFee.description.toLowerCase().includes(invoiceFee.description.toLowerCase());
    const typeMatch = invoiceFee.type === contractFee.type;
    return descMatch && typeMatch;
  }

  private async generateRationale(
    discrepancies: ReconciliationResult['discrepancies'],
    checklist: ReconciliationResult['checklist'],
  ): Promise<string> {
    const context = `Invoice reconciliation identified ${discrepancies.length} discrepancies with total impact of $${
      discrepancies.reduce((sum, d) => sum + d.amount, 0).toFixed(2)
    }. Priority levels: ${
      discrepancies.filter(d => d.priority === DiscrepancyPriority.CRITICAL).length
    } critical, ${
      discrepancies.filter(d => d.priority === DiscrepancyPriority.HIGH).length
    } high.`;

    return await this.aiService.explainInPlainEnglish(
      { discrepancies, checklist },
      context,
    );
  }
}
# Contract Recreation Platform Style Guide

## Brand Identity
The Contract Recreation Platform is a professional B2B SaaS tool focused on contract management and reconciliation. The design should convey trust, efficiency, and clarity.

## Color Palette

### Primary Colors
- **Primary Blue**: #2563eb (Main actions, primary buttons)
- **Primary Dark**: #1e40af (Hover states, active elements)

### Neutral Colors
- **Gray-900**: #111827 (Primary text)
- **Gray-700**: #374151 (Secondary text)
- **Gray-500**: #6b7280 (Tertiary text, placeholders)
- **Gray-300**: #d1d5db (Borders)
- **Gray-100**: #f3f4f6 (Backgrounds)
- **Gray-50**: #f9fafb (Light backgrounds)
- **White**: #ffffff (Cards, modals)

### Semantic Colors
- **Success Green**: #10b981
- **Error Red**: #ef4444
- **Warning Amber**: #f59e0b
- **Info Blue**: #3b82f6

## Typography

### Font Family
- **Primary**: Inter, system-ui, -apple-system, sans-serif
- **Monospace**: 'SF Mono', Monaco, Consolas, monospace (for contract IDs, codes)

### Font Sizes
- **Heading 1**: 32px (2rem) - Page titles
- **Heading 2**: 24px (1.5rem) - Section headers
- **Heading 3**: 20px (1.25rem) - Card titles
- **Body Large**: 18px (1.125rem) - Important text
- **Body**: 16px (1rem) - Default text
- **Small**: 14px (0.875rem) - Secondary text
- **Caption**: 12px (0.75rem) - Labels, timestamps

## Spacing System
Base unit: 4px
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## Component Specifics

### Cards
- Border radius: 8px
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
- Padding: 24px
- Background: White

### Buttons
- Height: 40px (default), 32px (small)
- Border radius: 6px
- Font weight: 500
- Letter spacing: 0.025em

### Form Inputs
- Height: 40px
- Border radius: 6px
- Border: 1px solid #d1d5db
- Focus border: #2563eb
- Padding: 0 12px

### Tables
- Row height: 48px
- Header background: #f9fafb
- Border: 1px solid #e5e7eb
- Hover row: #f9fafb

## Layout Principles

### Navigation
- Fixed sidebar width: 240px
- Top header height: 64px
- Mobile breakpoint: 768px

### Content Areas
- Max content width: 1280px
- Page padding: 32px (desktop), 16px (mobile)
- Section spacing: 48px

## Interaction States

### Hover
- Buttons: Darken by 10%
- Links: Underline
- Cards: Subtle shadow increase

### Focus
- Outline: 2px solid #2563eb
- Outline offset: 2px

### Disabled
- Opacity: 0.5
- Cursor: not-allowed

## Icons
- Use Heroicons or similar modern icon set
- Size: 20px (default), 16px (small), 24px (large)
- Stroke width: 1.5px

## Specific Platform Features

### Contract Cards
- Display contract ID prominently in monospace
- Status badges with semantic colors
- Clear action buttons (View, Edit, Delete)

### Reconciliation Status
- Progress bars for matching progress
- Color-coded match confidence levels
- Clear discrepancy highlights

### Data Tables
- Sortable columns with clear indicators
- Pagination controls
- Bulk action toolbar
- Export options visible

## Accessibility Requirements
- WCAG AA compliance minimum
- Focus indicators on all interactive elements
- Proper ARIA labels for complex components
- Keyboard navigation support throughout
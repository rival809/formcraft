import { z } from 'zod'

// ─── Field Types ──────────────────────────────────────────────────────────────

export const FieldType = z.enum([
  'short_text',
  'long_text',
  'number',
  'email',
  'phone',
  'url',
  'date',
  'time',
  'dropdown',
  'multi_select',
  'radio',
  'checkbox',
  'rating',
  'scale',
  'file_upload',
  'signature',
  'section_break',
  'statement',
])

export type FieldType = z.infer<typeof FieldType>

// ─── Validation Rules ─────────────────────────────────────────────────────────

export const FieldValidation = z.object({
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSizeMb: z.number().optional(),
})

export type FieldValidation = z.infer<typeof FieldValidation>

// ─── Field Choice (for dropdown, radio, checkbox) ─────────────────────────────

export const FieldChoice = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
})

export type FieldChoice = z.infer<typeof FieldChoice>

// ─── Form Field ───────────────────────────────────────────────────────────────

export const FormField = z.object({
  id: z.string(),
  type: FieldType,
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  choices: z.array(FieldChoice).optional(),
  validation: FieldValidation.optional(),
  width: z.enum(['full', 'half']).default('full'),
})

export type FormField = z.infer<typeof FormField>

// ─── Conditional Logic ────────────────────────────────────────────────────────

export const LogicOperator = z.enum(['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'])
export const LogicAction = z.enum(['show', 'hide', 'require', 'skip_to'])

export const LogicCondition = z.object({
  fieldId: z.string(),
  operator: LogicOperator,
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
})

export const LogicRule = z.object({
  id: z.string(),
  conditions: z.array(LogicCondition),
  conditionMatch: z.enum(['all', 'any']).default('all'),
  action: LogicAction,
  targetFieldId: z.string(),
})

export type LogicRule = z.infer<typeof LogicRule>

// ─── Form Settings ────────────────────────────────────────────────────────────

export const FormSettings = z.object({
  allowMultipleSubmissions: z.boolean().default(false),
  requireAuth: z.boolean().default(false),
  showProgressBar: z.boolean().default(true),
  submitButtonText: z.string().default('Submit'),
  successMessage: z.string().default('Thank you for your response!'),
  redirectUrl: z.string().optional(),
  closedMessage: z.string().default('This form is no longer accepting responses.'),
  notifyOwnerOnSubmit: z.boolean().default(true),
  sendConfirmationEmail: z.boolean().default(false),
  confirmationEmailFieldId: z.string().optional(),
  captchaEnabled: z.boolean().default(false),
  responseLimitEnabled: z.boolean().default(false),
  responseLimit: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
})

export type FormSettings = z.infer<typeof FormSettings>

// ─── Form Theme ───────────────────────────────────────────────────────────────

export const FormTheme = z.object({
  primaryColor: z.string().default('#3b82f6'),
  backgroundColor: z.string().default('#ffffff'),
  fontFamily: z.string().default('Inter'),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
  logoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
})

export type FormTheme = z.infer<typeof FormTheme>

// ─── Create/Update DTOs ───────────────────────────────────────────────────────

export const CreateFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  workspaceId: z.string().cuid(),
})

export const UpdateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  fields: z.array(FormField).optional(),
  logic: z.array(LogicRule).optional(),
  settings: FormSettings.partial().optional(),
  theme: FormTheme.partial().optional(),
})

export type CreateFormInput = z.infer<typeof CreateFormSchema>
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>

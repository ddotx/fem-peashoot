import { z } from 'zod/v4'
import { TemperatureSchema } from '../value-objects/temperature.type.js'

export const MonthlyTemperatureRangeSchema = z.object({
    id: z.string(),
    month: z.int().min(0).max(11),
    min: TemperatureSchema,
    max: TemperatureSchema,
})

export type MonthlyTemperatureRange = z.infer<typeof MonthlyTemperatureRangeSchema>
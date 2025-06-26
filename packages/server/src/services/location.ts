import { Logger } from 'winston'
import { AppDataSource } from '../data-source'
import { Location } from '../entities/location'
import * as fs from 'fs'
import { join } from 'path'
import { JSONValue } from '../types/json'
import { parse } from 'yaml'
import z from 'zod/v4'
import { MonthlyTemperatureRange } from '../entities/monthly-temperature-range'

const TEMPERATURE_DATA_FILE_PATH = join(
	__dirname,
	'..',
	'..',
	'data',
	'temperature-ranges.yml',
)

const LocationFileData = z.object({
	locations: z.array(z.object({
		name: z.string(),
		region: z.string(),
		country: z.string(),
		monthlyTemperatures: z.array(z.object({
			month: z.number(),
			temperatureRange: z.object({
				min: z.tuple([z.number(), z.union([z.literal('C'), z.literal('F')])]),
				max: z.tuple([z.number(), z.union([z.literal('C'), z.literal('F')])]),
			}),
		})),
	})),
})

export async function loadTemperatureData(logger: Logger) {
	if (!fs.existsSync(TEMPERATURE_DATA_FILE_PATH)) {
		logger.error(`Temperature data file not found at ${TEMPERATURE_DATA_FILE_PATH}`)
		return
	}

	try {
		const dataString = fs.readFileSync(TEMPERATURE_DATA_FILE_PATH, 'utf8')
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const parsedData = parse(dataString) as JSONValue

		const fileData = LocationFileData.parse(parsedData)
		// console.log(JSON.stringify(fileData, null, 2))

		// TODO: Parse temperature data into some model
		const locRepo = AppDataSource.getRepository(Location)
		const mtRepo = AppDataSource.getRepository(MonthlyTemperatureRange)
/* 		const locations = fileData.locations.map((locData): Promise<Location> => {
			const loc = locRepo.create({
				name: locData.name,
				region: locData.region,
				country: locData.country,
			})
			return locRepo.save(loc)
		})
		return await Promise.all(locations) */
		const locations: Location[] = []
		for (let i = 0; i < fileData.locations.length; i++) {
			const locData = fileData.locations[i]
			const l = locRepo.create({
				name: locData.name,
				region: locData.region,
				country: locData.country,
			})
			const loc = await locRepo.save(l)
			locations.push(loc)
			for (let monthData of locData.monthlyTemperatures) {
				const [minValue, minUnit] = monthData.temperatureRange.min
				const [maxValue, maxUnit] = monthData.temperatureRange.max
				const locMt = mtRepo.create({
					location: loc,
					month: monthData.month - 1,
					min: {
						value: minValue,
						unit: minUnit,
					},
					max: {
						value: maxValue,
						unit: maxUnit,
					},
				})
				await mtRepo.save(locMt)
			}
		}
		return locations

	} catch (error) {
		logger.error('Failed to validate temperature data', { error })
		throw new Error('Invalid temperature data format', { cause: error })
	}
}

export class LocationService {
	private locationRepository = AppDataSource.getRepository(Location)

	async getLocation(id: string): Promise<Location> {
		const location = await this.locationRepository.findOne({
			where: { id: `loc_${id}` },
			relations: ['monthlyTemperatures'],
		})
		if (!location) {
			throw new Error(`Location with id ${id} not found`)
		}
		return location
	}

	async getAllLocations(): Promise<Location[]> {
		return this.locationRepository.find()
	}

	async calculateDate(
		locationId: string,
		_temperature: { value: number; unit: 'C' | 'F' },
	): Promise<Date> {
		const location = await this.locationRepository.findOne({
			where: { id: locationId as `loc_${string}` },
		})
		if (!location) {
			throw new Error(`Location with id ${locationId} not found`)
		}
		// TODO: Implement the actual calculation
		return new Date(2025, 11, 31) // Default to December 31, 2025
	}
}

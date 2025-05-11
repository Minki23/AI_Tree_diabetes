// utils/dataTransform.ts
import { PatientData } from '../types/types';

/**
 * Transforms raw data from CSV into validated PatientData objects
 */
export const transformAndValidate = (rawData: Record<string, unknown>[]): PatientData[] => {
  return rawData
    .filter(record => {
      // Basic validation - require all numeric fields to be present and valid
      const requiredFields = [
        'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 
        'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome'
      ];
      
      return requiredFields.every(field => {
        const value = record[field];
        return value !== undefined && value !== null && value !== '' && !isNaN(Number(value));
      });
    })
    .map(record => {
      // Transform to our PatientData format
      return {
        pregnancies: Number(record['Pregnancies']),
        glucose: Number(record['Glucose']),
        bloodPressure: Number(record['BloodPressure']),
        skinThickness: Number(record['SkinThickness']),
        insulin: Number(record['Insulin']),
        bmi: Number(record['BMI']),
        diabetesPedigree: Number(record['DiabetesPedigreeFunction']),
        age: Number(record['Age']),
        outcome: Number(record['Outcome'])
      } as PatientData;
    });
};
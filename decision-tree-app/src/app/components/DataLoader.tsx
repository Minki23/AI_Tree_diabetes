import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import { PatientData } from '../types/types';

interface DataStats {
  total: number;
  valid: number;
  invalid: number;
}

interface NumericStats {
  min: number;
  max: number;
  avg: string;
  median: string;
  count: number;
}

interface CategoricalStats {
  distribution: {
    [key: string]: number;
  };
}

interface SummaryStats {
  [key: string]: NumericStats | CategoricalStats;
}

interface ChartDataItem {
  name: string;
  average: number;
  min: number;
  max: number;
}

interface DataLoaderProps {
  onDataLoaded?: Dispatch<SetStateAction<PatientData[]>>;
}

const DataLoader: React.FC<DataLoaderProps> = ({ onDataLoaded }) => {
  const [stats, setStats] = useState<DataStats>({ total: 0, valid: 0, invalid: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validData, setValidData] = useState<PatientData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({});
  const [showFullData, setShowFullData] = useState<boolean>(false);

  useEffect(() => {
    const loadDefaultData = async () => {
      try {
        const response = await fetch('/data/diabetes.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const text = await response.text();
        processData(text);
      } catch (error) {
        console.error('Error loading default data:', error);
        setError('Nie udało się załadować domyślnych danych.');
        setLoading(false);
      }
    };

    loadDefaultData();

  }, [onDataLoaded]);

  const processData = (text: string): void => {
    try {
      Papa.parse<Record<string, unknown>>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rawData = results.data as Record<string, unknown>[];
          const valid = rawData.filter(item => Object.values(item).every(val => val !== null && val !== undefined)
          ) as unknown as PatientData[];
          console.log('Valid data:', valid);
          onDataLoaded && onDataLoaded(valid);
          setValidData(valid);
          setStats({
            total: rawData.length,
            valid: valid.length,
            invalid: rawData.length - valid.length
          });
          
          // Calculate summary statistics
          calculateSummaryStats(valid);
          
          setLoading(false);
          setError(null);
        },
        error: () => {
          setError('Błąd przetwarzania pliku CSV.');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Processing error:', error);
      setError('Błąd przetwarzania danych.');
      setLoading(false);
    }
  };

  const calculateSummaryStats = (data: PatientData[]): void => {
    if (!data || data.length === 0) return;
    
    // Get numeric columns for statistics
    const firstRow = data[0];
    const numericColumns = Object.keys(firstRow).filter(key => 
      typeof firstRow[key] === 'number'
    );
    
    // Calculate stats for each numeric column
    const stats: SummaryStats = {};
    numericColumns.forEach(col => {
      const values = data
        .map(row => row[col])
        .filter((val): val is number => 
          val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)
        );
      
      stats[col] = {
        min: _.min(values) || 0,
        max: _.max(values) || 0,
        avg: _.mean(values).toFixed(2),
        median: calculateMedian(values),
        count: values.length
      } as NumericStats;
    });
    
    // Get distribution for categorical columns
    const categoricalColumns = Object.keys(firstRow).filter(key => 
      typeof firstRow[key] === 'string' || typeof firstRow[key] === 'boolean'
    );
    
    categoricalColumns.forEach(col => {
      const distribution = _.countBy(data, col);
      stats[col] = { distribution } as CategoricalStats;
    });
    
    setSummaryStats(stats);
  };
  
  const calculateMedian = (values: number[]): string => {
    if (!values.length) return '0';
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
      : sorted[mid].toFixed(2);
  };

  // Prepare data for visualization
  const prepareChartData = (): ChartDataItem[] => {
    if (!summaryStats || Object.keys(summaryStats).length === 0) return [];
    
    return Object.keys(summaryStats)
      .filter(key => 'avg' in summaryStats[key]) // Only numeric columns
      .map(key => {
        const stats = summaryStats[key] as NumericStats;
        return {
          name: key,
          average: parseFloat(stats.avg),
          min: stats.min,
          max: stats.max
        };
      });
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4 text-black">Dane pacjentów</h2>

      {loading ? (
        <div className="flex items-center space-x-2 text-gray-600">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Ładowanie danych...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      ) : (
        <>
          {/* Data stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Wszystkie rekordy</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
              <div className="text-sm text-gray-600">Poprawne rekordy</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-sm text-gray-600">Odrzucone rekordy</div>
            </div>
          </div>
          
          {/* Key metrics summary */}
          {Object.keys(summaryStats).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-black">Kluczowe metryki</h3>
              
              {/* Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                <h4 className="text-md font-medium mb-2 text-black">Wizualizacja metryki numerycznych</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="average" fill="#8884d8" name="Średnia" />
                      <Bar dataKey="min" fill="#82ca9d" name="Minimum" />
                      <Bar dataKey="max" fill="#ffc658" name="Maximum" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Numerical statistics */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                <h4 className="text-md font-medium mb-2 text-black">Statystyki numeryczne</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zmienna</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Średnia</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mediana</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liczba</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.keys(summaryStats)
                        .filter(key => 'avg' in summaryStats[key])
                        .map(key => {
                          const stats = summaryStats[key] as NumericStats;
                          return (
                            <tr key={key}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.min}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.max}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.avg}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.median}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.count}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Categorical distributions if any */}
              {Object.keys(summaryStats)
                .filter(key => 'distribution' in summaryStats[key])
                .length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
                  <h4 className="text-md font-medium mb-2">Rozkład zmiennych kategorycznych</h4>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {Object.keys(summaryStats)
                      .filter(key => 'distribution' in summaryStats[key])
                      .map(key => {
                        const stats = summaryStats[key] as CategoricalStats;
                        return (
                          <div key={key} className="border rounded p-3">
                            <h5 className="font-medium mb-2">{key}</h5>
                            <ul>
                              {Object.entries(stats.distribution).map(([value, count]) => (
                                <li key={value} className="flex justify-between">
                                  <span>{value || '(puste)'}: </span>
                                  <span>{count}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Full data view */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-black">Przegląd danych</h3>
              <button 
                onClick={() => setShowFullData(!showFullData)}
                className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded hover:bg-blue-200 transition-colors"
              >
                {showFullData ? 'Ukryj dane' : 'Pokaż dane'}
              </button>
            </div>
            
            {showFullData && validData.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(validData[0]).map(header => (
                          <th 
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.values(row).map((cell, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {cell !== null && cell !== undefined ? String(cell) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {file && !loading && !error && (
        <div className="mt-4 text-sm bg-green-50 p-3 rounded text-green-700">
          Pomyślnie załadowano plik: <strong>{file.name}</strong>
        </div>
      )}
    </div>
  );
};

export default DataLoader;
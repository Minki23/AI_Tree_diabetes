import { useLocation, useNavigate } from 'react-router-dom';
import { PatientData } from '../../types/types';
import { useEffect } from 'react';

const DataOverview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data: PatientData[] = location.state?.data;

  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      navigate('/');
    }
  }, [data, navigate]);

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-red-600">
        Nie znaleziono danych. Przekierowano z nieprawidłowym stanem.
      </div>
    );
  }

  const columns = Object.keys(data[0]).filter((key) => key !== 'outcome');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-black">Przegląd danych pacjentów</h2>
      <div className="overflow-auto border rounded shadow-sm">
        <table className="min-w-full text-sm text-gray-700 bg-white">
          <thead>
            <tr className="bg-gray-100 text-left">
              {columns.map((col) => (
                <th key={col} className="p-2 border-b font-semibold">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="p-2 border-b">{String(row[col as keyof PatientData])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Wróć
      </button>
    </div>
  );
};

export default DataOverview;

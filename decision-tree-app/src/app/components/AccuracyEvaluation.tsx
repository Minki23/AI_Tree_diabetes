import { useState } from 'react';
import { PatientData, TreeNode } from '../types/types';
import { Edge } from 'reactflow';

interface Props {
  nodes: TreeNode[];
  edges: Edge[];
  data: PatientData[];
}

const AccuracyEvaluation = ({ nodes, edges, data }: Props) => {
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    total: number;
    correct: number;
    tp: number; // True Positives
    tn: number; // True Negatives
    fp: number; // False Positives
    fn: number; // False Negatives
  } | null>(null);

  const handleEvaluate = () => {
    setLoading(true);
    setError(null);

    try {
      if (nodes.length === 0) {
        throw new Error('Drzewo decyzyjne jest puste');
      }

      const results = evaluateClientSide();
      setAccuracy(results.accuracy);
      setDetails(results.details);
    } catch (err: any) {
      setError(err.message);
      console.error('Błąd podczas oceny:', err);
    } finally {
      setLoading(false);
    }
  };

  const evaluateClientSide = () => {
    let correct = 0;
    let tp = 0; // True Positives – poprawnie przewidziane pozytywne przypadki
    let tn = 0; // True Negatives – poprawnie przewidziane negatywne przypadki
    let fp = 0; // False Positives – błędnie przewidziane pozytywne przypadki
    let fn = 0; // False Negatives – błędnie przewidziane negatywne przypadki

    for (const patient of data) {
      try {
        const prediction = evaluateTree(nodes, edges, patient);
        const actual = patient.outcome.toString();

        if (prediction === actual) {
          correct++;
          if (prediction === "1") tp++;
          else tn++;
        } else {
          if (prediction === "1") fp++;
          else fn++;
        }
      } catch (err: any) {
        console.warn("Błąd podczas oceny jednego przypadku:", err.message);
      }
    }

    const acc = Number(((correct / data.length) * 100).toFixed(2));
    return { accuracy: acc, details: { total: data.length, correct, tp, tn, fp, fn } };
  };

  const evaluateTree = (nodes: TreeNode[], edges: Edge[], patient: PatientData): string => {
    const findNode = (id: string) => {
      const node = nodes.find((x) => x.id === id);
      if (!node) throw new Error(`Nie znaleziono węzła o ID ${id}`);
      return node;
    };

    const evalNode = (id: string): string => {
      const node = findNode(id);

      if (node.data.type === 'result') {
        const val = String(node.data.results).toLowerCase();
        if (val === "1" || val === "true") return "1";
        if (val === "0" || val === "false") return "0";
        throw new Error(`Nieprawidłowa wartość wyniku w węźle ${id}: ${val}`);
      }

      const condition = node.data.condition;
      if (!condition || !condition.column || !condition.operator) {
        throw new Error(`Brak pełnego warunku w węźle ${id}`);
      }

      const { column, operator, value } = condition;
      const patientValue = patient[column as keyof PatientData];

      const numericValue = Number(value);
      const patientNumber = Number(patientValue);

      if (isNaN(numericValue) || isNaN(patientNumber)) {
        throw new Error(`Nieprawidłowe dane numeryczne w węźle ${id} (${column})`);
      }

      let result: boolean;
      switch (operator) {
        case '>': result = patientNumber > numericValue; break;
        case '<': result = patientNumber < numericValue; break;
        case '>=': result = patientNumber >= numericValue; break;
        case '<=': result = patientNumber <= numericValue; break;
        case '==': result = patientNumber === numericValue; break;
        default:
          throw new Error(`Nieznany operator "${operator}" w węźle ${id}`);
      }

      const branch = result ? 'true' : 'false';
      const edge = edges.find(e => e.source === id && e.sourceHandle === branch);
      if (!edge) {
        throw new Error(`Brak gałęzi ${branch} dla węzła ${id}`);
      }

      return evalNode(edge.target);
    };

    const root = nodes.find(n => n.id === 'root') || nodes[0];
    return evalNode(root.id);
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm text-black">
      <h2 className="text-xl font-semibold mb-4">Ocena dokładności modelu</h2>

      <button
        onClick={handleEvaluate}
        disabled={loading || nodes.length === 0}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Obliczanie...' : 'Oblicz dokładność'}
      </button>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {accuracy !== null && details && (
        <div className="mt-6 space-y-3">
          <div>
            <strong>Dokładność:</strong> {accuracy}% ({details.correct} poprawnych z {details.total} przypadków)
          </div>
          <div className="space-y-1">
            <div><strong>TP</strong> (True Positives): {details.tp} – przypadki pozytywne, poprawnie wykryte jako pozytywne</div>
            <div><strong>TN</strong> (True Negatives): {details.tn} – przypadki negatywne, poprawnie wykryte jako negatywne</div>
            <div><strong>FP</strong> (False Positives): {details.fp} – przypadki negatywne, błędnie zaklasyfikowane jako pozytywne</div>
            <div><strong>FN</strong> (False Negatives): {details.fn} – przypadki pozytywne, błędnie zaklasyfikowane jako negatywne</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccuracyEvaluation;

import React, { useEffect, useState } from 'react';
import { HistoryLog } from '../types';
import { getHistoryLogs } from '../services/firebaseService';
import { X, History, Loader2, User, Clock, Activity } from 'lucide-react';

interface HistoryModalProps {
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getHistoryLogs(100);
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'DELETE': return 'text-red-600 bg-red-50 border-red-200';
      case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'SWAP': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'GENERATE': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'CLEAR': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
        case 'CREATE': return 'Criação';
        case 'DELETE': return 'Remoção';
        case 'UPDATE': return 'Edição';
        case 'SWAP': return 'Troca';
        case 'GENERATE': return 'Geração';
        case 'CLEAR': return 'Limpeza';
        default: return action;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <History size={20} />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-none">Histórico de Alterações</h3>
                <p className="text-xs text-slate-500 mt-1">Registo de atividades na escala</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="text-sm font-medium">A carregar histórico...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <History size={48} className="opacity-20" />
              <p>Não existem registos de histórico.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-white transition-colors flex gap-4 items-start group">
                  <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(log.timestamp).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                        {new Date(log.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1" title={log.userEmail}>
                            <User size={10} />
                            {log.userEmail.split('@')[0]}
                        </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-snug">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-white text-center">
            <p className="text-[10px] text-slate-400">Apenas as últimas 100 alterações são mostradas.</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;

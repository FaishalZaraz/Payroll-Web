import { useToast } from '../../context/ToastContext';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || CheckCircle;
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={18} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

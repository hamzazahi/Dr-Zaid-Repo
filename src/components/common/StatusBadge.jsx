import { Chip } from '@mui/material';
import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status, size = 'small' }) => {
  const getLabel = () => {
    if (!status) return 'Unknown';
    return status;
  };

  const getMuiColor = (statusVal) => {
    const color = getStatusColor(statusVal);
    // Map custom colors to standard MUI Chip color keys
    switch (color) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'secondary':
        return 'secondary';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={getLabel()}
      color={getMuiColor(status)}
      size={size}
      variant="outlined"
      sx={{
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        borderRadius: '6px',
        borderWidth: '1.5px',
      }}
    />
  );
};

export default StatusBadge;

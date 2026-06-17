import { Box, Chip, Typography, Stack, Skeleton } from '@mui/material';
import { colors } from '../../theme/theme';

/**
 * StatusBadge - Display appointment/treatment status
 */
export const StatusBadge = ({ 
  status = 'pending', 
  size = 'medium',
  icon
}) => {
  const statusConfig = {
    pending: {
      label: 'Pending',
      color: colors.warning,
      bgcolor: colors.warning + '15',
    },
    scheduled: {
      label: 'Scheduled',
      color: colors.info,
      bgcolor: colors.info + '15',
    },
    completed: {
      label: 'Completed',
      color: colors.success,
      bgcolor: colors.success + '15',
    },
    cancelled: {
      label: 'Cancelled',
      color: colors.textLight,
      bgcolor: colors.border,
    },
    active: {
      label: 'Active',
      color: colors.success,
      bgcolor: colors.success + '15',
    },
    inactive: {
      label: 'Inactive',
      color: colors.textSecondary,
      bgcolor: colors.border,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const sizeStyles = {
    small: { fontSize: '0.7rem', height: 20, px: 1 },
    medium: { fontSize: '0.75rem', height: 24, px: 1.25 },
    large: { fontSize: '0.85rem', height: 28, px: 1.5 },
  };

  return (
    <Chip
      icon={icon}
      label={config.label}
      size={size === 'small' ? 'small' : 'medium'}
      sx={{
        ...sizeStyles[size],
        bgcolor: config.bgcolor,
        color: config.color,
        fontWeight: 600,
        border: `1px solid ${config.color}30`,
        cursor: 'default',
      }}
    />
  );
};

/**
 * EmptyState - Show when no data available
 */
export const EmptyState = ({ 
  icon, 
  title, 
  description,
  action,
  height = 300 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        py: 4,
        px: 2,
        borderRadius: '8px',
        bgcolor: colors.surfaceAlt,
        border: `2px dashed ${colors.border}`,
      }}
    >
      {icon && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: colors.border,
            color: colors.textLight,
            mb: 2,
            fontSize: '2rem',
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textPrimary, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: colors.textSecondary, 
          mb: 2,
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        {description}
      </Typography>
      {action && action}
    </Box>
  );
};

/**
 * TableSkeleton - Loading state for tables
 */
export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <Box>
      {[...Array(rows)].map((_, rowIdx) => (
        <Box
          key={rowIdx}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 2,
            p: 2,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {[...Array(columns)].map((_, colIdx) => (
            <Skeleton 
              key={colIdx} 
              variant="text" 
              width="100%"
              height={20}
              sx={{ borderRadius: '4px' }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

/**
 * CardSkeleton - Loading state for cards
 */
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <Stack spacing={2}>
      {[...Array(count)].map((_, idx) => (
        <Box
          key={idx}
          sx={{
            p: 2,
            borderRadius: '8px',
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} />
        </Box>
      ))}
    </Stack>
  );
};

/**
 * ContentSkeleton - Loading state for content
 */
export const ContentSkeleton = () => {
  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2, borderRadius: '8px' }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={100} sx={{ borderRadius: '8px' }} />
        ))}
      </Box>
    </Box>
  );
};

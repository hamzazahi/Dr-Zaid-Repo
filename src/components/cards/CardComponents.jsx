import { Box, Card, Typography, Stack, LinearProgress } from '@mui/material';
import { colors } from '../../theme/theme';

/**
 * StatsCard - Display key metrics
 */
export const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle,
  color = 'primary',
  onClick 
}) => {
  const bgColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '8px',
            bgcolor: bgColor[color] + '15',
            color: bgColor[color],
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
            {title}
          </Typography>
          <Stack direction="row" alignItems="baseline" gap={1} sx={{ mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary }}>
              {value}
            </Typography>
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: trend > 0 ? colors.success : colors.error,
                }}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Typography>
            )}
          </Stack>
          {subtitle && (
            <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

/**
 * ProgressCard - Show progress with status
 */
export const ProgressCard = ({ 
  title, 
  value, 
  max, 
  status = 'default',
  subtitle 
}) => {
  const percentage = (value / max) * 100;
  const statusColors = {
    default: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  return (
    <Card sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: colors.textPrimary }}>
          {Math.round(percentage)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: colors.borderLight,
          '& .MuiLinearProgress-bar': {
            bgcolor: statusColors[status],
            borderRadius: 3,
          },
        }}
      />
    </Card>
  );
};

/**
 * InfoCard - Display information with label
 */
export const InfoCard = ({ label, value, icon, color = 'primary' }) => {
  const bgColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '6px',
        bgcolor: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '4px',
              bgcolor: bgColor[color] + '15',
              color: bgColor[color],
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color: colors.textPrimary, ml: 3.5 }}>
        {value}
      </Typography>
    </Box>
  );
};

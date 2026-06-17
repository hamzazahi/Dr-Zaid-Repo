import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F6F8FB' }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <Box
        component="div"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <Header />

        {/* Dynamic Main Page Content */}
        <Box
          component="section"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            overflowY: 'auto',
            bgcolor: '#F6F8FB',
            backgroundImage: 'radial-gradient(circle at top right, rgba(29, 78, 216, 0.06), transparent 28rem)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;

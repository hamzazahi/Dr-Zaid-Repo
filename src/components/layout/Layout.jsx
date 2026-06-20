import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

export const SIDEBAR_W           = 256;
export const SIDEBAR_W_COLLAPSED = 64;

const TRANSITION = 'width 0.22s cubic-bezier(0.4,0,0.2,1)';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    /*
     * Root: strict 100vh, no overflow.
     * The MUI permanent Drawer root <div> is already a flex placeholder
     * that matches its paper width — no manual spacer needed here.
     */
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: '#F4F6FA',
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        transition={TRANSITION}
      />

      {/*
       * Main column: flex: 1 + minWidth: 0 prevents content from blowing
       * past the sidebar boundary on narrow viewports.
       */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: TRANSITION,
        }}
      >
        <Header />

        {/* Scrollable page body */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;

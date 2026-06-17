import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Paper,
  Checkbox,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { colors } from '../../theme/theme';

/**
 * DataTable - Professional data table with sorting and pagination
 */
export const DataTable = ({
  columns,
  data,
  onRowClick,
  selectable = false,
  sortBy = null,
  onSort = null,
  isLoading = false,
  emptyState = 'No data available',
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(sortBy);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleSelectClick = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    if (onSort) {
      onSort(property, isAsc ? 'desc' : 'asc');
    }
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);
  const visibleRows = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    bgcolor: colors.surfaceAlt,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    bgcolor: colors.surfaceAlt,
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    minWidth: column.minWidth || 100,
                    width: column.width,
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={(event) => handleRequestSort(event, column.id)}
                      sx={{
                        '&.Mui-active .MuiTableSortLabel-icon': {
                          color: colors.primary,
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <TableRow
                    key={row.id || index}
                    onClick={() => onRowClick && onRowClick(row)}
                    selected={isItemSelected}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: colors.borderLight,
                      },
                      '&.Mui-selected': {
                        bgcolor: colors.primary + '10',
                        '&:hover': {
                          bgcolor: colors.primary + '15',
                        },
                      },
                    }}
                  >
                    {selectable && (
                      <TableCell
                        padding="checkbox"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={(event) => handleSelectClick(event, row.id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell
                          key={column.id}
                          align={column.align || 'left'}
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: column.fontWeight,
                          }}
                        >
                          {column.render ? column.render(value, row) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary" variant="body2">
                    {emptyState}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          borderTop: `1px solid ${colors.border}`,
          bgcolor: colors.surface,
        }}
      />
    </Paper>
  );
};

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const response = await axios.get('http://localhost:5000/admin/subscriptions', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setSubscriptions(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        try {
            await axios.post(
                `http://localhost:5000/admin/subscriptions/${selectedSubscription.id}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            fetchSubscriptions();
            setOpenDialog(false);
        } catch (error) {
            setError(error.response?.data?.message || 'Error canceling subscription');
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'customerName', headerName: 'Customer', width: 200 },
        { field: 'planName', headerName: 'Plan', width: 150 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Box
                    sx={{
                        backgroundColor:
                            params.value === 'active'
                                ? '#e8f5e9'
                                : params.value === 'cancelled'
                                    ? '#ffebee'
                                    : '#fff3e0',
                        color:
                            params.value === 'active'
                                ? '#2e7d32'
                                : params.value === 'cancelled'
                                    ? '#c62828'
                                    : '#ef6c00',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textTransform: 'capitalize',
                    }}
                >
                    {params.value}
                </Box>
            ),
        },
        {
            field: 'startDate',
            headerName: 'Start Date',
            width: 180,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
        },
        {
            field: 'endDate',
            headerName: 'End Date',
            width: 180,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 120,
            valueFormatter: (params) => `₹${params.value.toLocaleString()}`,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                            // Handle edit action
                        }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                            setSelectedSubscription(params.row);
                            setOpenDialog(true);
                        }}
                        disabled={params.row.status !== 'active'}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const filteredSubscriptions = subscriptions.filter(
        (subscription) =>
            subscription.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription.planName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Subscriptions
                </Typography>
                <TextField
                    size="small"
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Paper sx={{ height: '100%', width: '100%' }}>
                <DataGrid
                    rows={filteredSubscriptions}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    checkboxSelection
                    disableSelectionOnClick
                    loading={loading}
                    sx={{
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                        },
                    }}
                />
            </Paper>

            {/* Cancel Subscription Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>
                    Cancel Subscription
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpenDialog(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Typography>
                        Are you sure you want to cancel the subscription for{' '}
                        {selectedSubscription?.customerName}?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleCancelSubscription} color="error">
                        Confirm Cancellation
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Subscriptions; 
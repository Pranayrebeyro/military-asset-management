import { useEffect, useState } from 'react';
import api from '../services/api.js';

const Dashboard = () => {

    const [metrics, setMetrics] = useState(null);

    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    const [baseId, setBaseId] = useState('');
    const [equipmentTypeId, setEquipmentTypeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ========================================================
    // LOAD LOOKUPS
    // ========================================================

    const fetchLookups = async () => {

        try {

            const [
                basesResponse,
                equipmentResponse
            ] = await Promise.all([
                api.get('/lookups/bases'),
                api.get('/lookups/equipment-types')
            ]);

            setBases(
                basesResponse.data.bases || []
            );

            setEquipmentTypes(
                equipmentResponse.data.equipmentTypes || []
            );

        } catch (error) {

            console.error(
                'Failed to load dashboard lookups:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Failed to load dashboard filters'
            );
        }
    };

    // ========================================================
    // FETCH DASHBOARD
    // ========================================================

    const fetchDashboard = async () => {

        try {

            setLoading(true);
            setError('');

            const params = {};

            if (baseId) {
                params.baseId = baseId;
            }

            if (equipmentTypeId) {
                params.equipmentTypeId =
                    equipmentTypeId;
            }

            if (startDate) {
                params.startDate =
                    `${startDate} 00:00:00`;
            }

            if (endDate) {
                params.endDate =
                    `${endDate} 23:59:59`;
            }

            const response = await api.get(
                '/assets/dashboard',
                { params }
            );

            setMetrics(response.data);

        } catch (error) {

            console.error(
                'Dashboard error:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Failed to load dashboard'
            );

        } finally {

            setLoading(false);
        }
    };

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        const loadDashboard = async () => {

            await fetchLookups();
            await fetchDashboard();

        };

        loadDashboard();

    }, []);

    // ========================================================
    // APPLY FILTERS
    // ========================================================

    const handleApplyFilters = () => {
        fetchDashboard();
    };

    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    const handleClearFilters = () => {

        setBaseId('');
        setEquipmentTypeId('');
        setStartDate('');
        setEndDate('');

        setTimeout(() => {
            fetchDashboard();
        }, 0);
    };

    // ========================================================
    // LOADING
    // ========================================================

    if (loading && !metrics) {

        return (
            <div className="dashboard-page">

                <h1>Dashboard</h1>

                <p>
                    Loading dashboard...
                </p>

            </div>
        );
    }

    return (
        <div className="dashboard-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="dashboard-header">

                <div>

                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        Military Asset Management Overview
                    </p>

                </div>

            </div>


            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="filter-card">

                {/* BASE */}

                <div className="filter-group">

                    <label>
                        Base
                    </label>

                    <select
                        value={baseId}
                        onChange={(e) =>
                            setBaseId(e.target.value)
                        }
                    >

                        <option value="">
                            All Bases
                        </option>

                        {bases.map((base) => (

                            <option
                                key={base.id}
                                value={base.id}
                            >
                                {base.name} - {base.location}
                            </option>

                        ))}

                    </select>

                </div>


                {/* EQUIPMENT TYPE */}

                <div className="filter-group">

                    <label>
                        Equipment Type
                    </label>

                    <select
                        value={equipmentTypeId}
                        onChange={(e) =>
                            setEquipmentTypeId(
                                e.target.value
                            )
                        }
                    >

                        <option value="">
                            All Equipment Types
                        </option>

                        {equipmentTypes.map(
                            (equipment) => (

                                <option
                                    key={equipment.id}
                                    value={equipment.id}
                                >
                                    {equipment.name}
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* START DATE */}

                <div className="filter-group">

                    <label>
                        Start Date
                    </label>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                            setStartDate(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* END DATE */}

                <div className="filter-group">

                    <label>
                        End Date
                    </label>

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                            setEndDate(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* BUTTONS */}

                <div className="filter-actions">

                    <button
                        className="apply-button"
                        onClick={
                            handleApplyFilters
                        }
                    >
                        Apply Filters
                    </button>

                    <button
                        className="clear-button"
                        onClick={
                            handleClearFilters
                        }
                    >
                        Clear
                    </button>

                </div>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="dashboard-error">

                    {error}

                </div>

            )}


            {/* ==================================================
                METRICS
            ================================================== */}

            {metrics && (

                <div className="metrics-grid">

                    <div className="metric-card">
                        <span>
                            Opening Balance
                        </span>

                        <strong>
                            {metrics.opening_balance}
                        </strong>
                    </div>


                    <div className="metric-card">
                        <span>
                            Total Purchases
                        </span>

                        <strong>
                            {metrics.total_purchases}
                        </strong>
                    </div>


                    <div className="metric-card">
                        <span>
                            Transfer In
                        </span>

                        <strong>
                            {metrics.total_transfer_in}
                        </strong>
                    </div>


                    <div className="metric-card">
                        <span>
                            Transfer Out
                        </span>

                        <strong>
                            {metrics.total_transfer_out}
                        </strong>
                    </div>


                    <div className="metric-card">
                        <span>
                            Net Movement
                        </span>

                        <strong>
                            {metrics.net_movement}
                        </strong>
                    </div>


                    <div className="metric-card">
                        <span>
                            Assigned
                        </span>

                        <strong>
                            {metrics.total_assigned}
                        </strong>
                    </div>


                    <div className="metric-card">
                        <span>
                            Expended
                        </span>

                        <strong>
                            {metrics.total_expended}
                        </strong>
                    </div>


                    <div className="metric-card closing-card">
                        <span>
                            Closing Balance
                        </span>

                        <strong>
                            {metrics.closing_balance}
                        </strong>
                    </div>

                </div>
            )}


            {loading && metrics && (

                <p className="refresh-message">
                    Updating dashboard...
                </p>

            )}

        </div>
    );
};

export default Dashboard;
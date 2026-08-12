import { useEffect, useState } from 'react';
import api from '../services/api.js';

const Transfers = () => {

    const [transfers, setTransfers] = useState([]);

    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    const [sourceBaseId, setSourceBaseId] = useState('');
    const [destinationBaseId, setDestinationBaseId] = useState('');
    const [equipmentTypeId, setEquipmentTypeId] = useState('');
    const [quantity, setQuantity] = useState('');

    const [userRole, setUserRole] = useState('');
    const [userBaseId, setUserBaseId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingLookups, setLoadingLookups] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    // ========================================================
    // GET LOGGED-IN USER FROM JWT
    // ========================================================

    const getLoggedInUser = () => {

        try {

            const token = localStorage.getItem('token');

            if (!token) {
                return null;
            }

            const payload = token.split('.')[1];

            const decodedPayload = JSON.parse(
                atob(
                    payload
                        .replace(/-/g, '+')
                        .replace(/_/g, '/')
                )
            );

            return decodedPayload;

        } catch (error) {

            console.error(
                'Failed to decode authentication token:',
                error
            );

            return null;
        }
    };


    // ========================================================
    // LOAD BASES AND EQUIPMENT TYPES
    // ========================================================

    const fetchLookups = async () => {

        try {

            setLoadingLookups(true);
            setError('');

            const [
                basesResponse,
                equipmentResponse
            ] = await Promise.all([
                api.get('/lookups/bases'),
                api.get('/lookups/equipment-types')
            ]);

            const allBases =
                basesResponse.data.bases || [];

            const equipmentList =
                equipmentResponse.data.equipmentTypes || [];


            // ------------------------------------------------
            // GET LOGGED-IN USER
            // ------------------------------------------------

            const user = getLoggedInUser();

            const role = user?.role || '';
            const loggedInBaseId =
                user?.baseId ?? null;

            setUserRole(role);
            setUserBaseId(loggedInBaseId);


            // ------------------------------------------------
            // FILTER BASES
            // ------------------------------------------------

            let availableBases = allBases;

            if (
                role === 'BASE_COMMANDER' &&
                loggedInBaseId
            ) {

                availableBases = allBases.filter(
                    (base) =>
                        Number(base.id) ===
                        Number(loggedInBaseId)
                );

            }

            setBases(availableBases);
            setEquipmentTypes(equipmentList);


            // ------------------------------------------------
            // DEFAULT SOURCE BASE
            // ------------------------------------------------

            if (
                role === 'BASE_COMMANDER' &&
                loggedInBaseId
            ) {

                setSourceBaseId(
                    String(loggedInBaseId)
                );

            } else if (availableBases.length > 0) {

                setSourceBaseId(
                    String(availableBases[0].id)
                );

            } else {

                setSourceBaseId('');

            }


            // ------------------------------------------------
            // DEFAULT DESTINATION
            // ------------------------------------------------

            if (role === 'ADMIN') {

                if (availableBases.length > 1) {

                    setDestinationBaseId(
                        String(availableBases[1].id)
                    );

                } else {

                    setDestinationBaseId('');

                }

            } else {

                /*
                 * BASE_COMMANDER can transfer from their
                 * own base to another base.
                 *
                 * Therefore destination uses ALL bases,
                 * while source is restricted to their base.
                 */

                if (allBases.length > 1) {

                    const destination =
                        allBases.find(
                            (base) =>
                                Number(base.id) !==
                                Number(loggedInBaseId)
                        );

                    setDestinationBaseId(
                        destination
                            ? String(destination.id)
                            : ''
                    );

                } else {

                    setDestinationBaseId('');

                }
            }


            // ------------------------------------------------
            // DEFAULT EQUIPMENT
            // ------------------------------------------------

            if (equipmentList.length > 0) {

                setEquipmentTypeId(
                    String(equipmentList[0].id)
                );

            } else {

                setEquipmentTypeId('');

            }

        } catch (err) {

            console.error(
                'Failed to load lookup data:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to load bases and equipment types'
            );

        } finally {

            setLoadingLookups(false);
        }
    };


    // ========================================================
    // LOAD TRANSFER HISTORY
    // ========================================================

    const fetchTransfers = async () => {

        try {

            setLoading(true);

            const response =
                await api.get('/transfers');

            setTransfers(
                response.data.transfers || []
            );

        } catch (err) {

            console.error(
                'Failed to load transfers:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to load transfer history'
            );

        } finally {

            setLoading(false);
        }
    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        fetchLookups();
        fetchTransfers();

    }, []);


    // ========================================================
    // CREATE TRANSFER
    // ========================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError('');
        setSuccess('');


        // ----------------------------------------------------
        // Validate fields
        // ----------------------------------------------------

        if (
            !sourceBaseId ||
            !destinationBaseId ||
            !equipmentTypeId ||
            !quantity
        ) {

            setError(
                'All fields are required'
            );

            return;
        }


        // ----------------------------------------------------
        // Prevent same source/destination
        // ----------------------------------------------------

        if (
            Number(sourceBaseId) ===
            Number(destinationBaseId)
        ) {

            setError(
                'Source and destination bases must be different'
            );

            return;
        }


        // ----------------------------------------------------
        // Validate quantity
        // ----------------------------------------------------

        const quantityNumber =
            Number(quantity);

        if (
            !Number.isInteger(quantityNumber) ||
            quantityNumber <= 0
        ) {

            setError(
                'Quantity must be a positive integer'
            );

            return;
        }


        // ----------------------------------------------------
        // Frontend RBAC protection
        // ----------------------------------------------------

        if (
            userRole === 'BASE_COMMANDER' &&
            Number(sourceBaseId) !==
                Number(userBaseId)
        ) {

            setError(
                'You are not authorized to transfer assets from this base'
            );

            return;
        }


        try {

            setSubmitting(true);

            const response =
                await api.post(
                    '/transfers',
                    {
                        source_base_id:
                            Number(sourceBaseId),

                        destination_base_id:
                            Number(destinationBaseId),

                        equipment_type_id:
                            Number(equipmentTypeId),

                        quantity:
                            quantityNumber
                    }
                );


            setSuccess(
                response.data.message ||
                'Transfer completed successfully'
            );


            setQuantity('');


            // Refresh history
            await fetchTransfers();

        } catch (err) {

            console.error(
                'Transfer failed:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Transfer failed'
            );

        } finally {

            setSubmitting(false);
        }
    };


    // ========================================================
    // LOADING
    // ========================================================

    if (loadingLookups) {

        return (
            <div className="management-page">

                <div className="page-header">

                    <div>

                        <h1>
                            Transfers
                        </h1>

                        <p>
                            Transfer equipment between
                            military bases
                        </p>

                    </div>

                </div>

                <div className="table-card">

                    <p className="table-message">
                        Loading bases and equipment types...
                    </p>

                </div>

            </div>
        );
    }


    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div className="management-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="page-header">

                <div>

                    <h1>
                        Transfers
                    </h1>

                    <p>
                        Transfer equipment between
                        military bases
                    </p>

                </div>

            </div>


            {/* ==================================================
                ALERTS
            ================================================== */}

            {error && (

                <div className="alert error-alert">
                    {error}
                </div>

            )}


            {success && (

                <div className="alert success-alert">
                    {success}
                </div>

            )}


            {/* ==================================================
                CREATE TRANSFER
            ================================================== */}

            <div className="form-card">

                <h2>
                    Create Transfer
                </h2>


                <form onSubmit={handleSubmit}>

                    <div className="form-grid">


                        {/* ======================================
                            SOURCE BASE
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="sourceBase">
                                Source Base
                            </label>


                            <select
                                id="sourceBase"
                                value={sourceBaseId}
                                onChange={(event) =>
                                    setSourceBaseId(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    bases.length === 0 ||
                                    userRole ===
                                        'BASE_COMMANDER'
                                }
                            >

                                {userRole === 'ADMIN' && (

                                    <option value="">
                                        Select Source Base
                                    </option>

                                )}


                                {bases.map((base) => (

                                    <option
                                        key={base.id}
                                        value={base.id}
                                    >
                                        {base.name}
                                        {' - '}
                                        {base.location}
                                    </option>

                                ))}

                            </select>


                            {userRole ===
                                'BASE_COMMANDER' && (

                                <small>
                                    Your assigned base is the
                                    source base.
                                </small>

                            )}

                        </div>


                        {/* ======================================
                            DESTINATION BASE
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="destinationBase">
                                Destination Base
                            </label>


                            <select
                                id="destinationBase"
                                value={destinationBaseId}
                                onChange={(event) =>
                                    setDestinationBaseId(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    allBasesUnavailable(
                                        bases,
                                        userRole
                                    )
                                }
                            >

                                <option value="">
                                    Select Destination Base
                                </option>


                                {getDestinationBases(
                                    bases,
                                    userRole,
                                    userBaseId
                                ).map((base) => (

                                    <option
                                        key={base.id}
                                        value={base.id}
                                    >
                                        {base.name}
                                        {' - '}
                                        {base.location}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* ======================================
                            EQUIPMENT TYPE
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="equipmentType">
                                Equipment Type
                            </label>


                            <select
                                id="equipmentType"
                                value={equipmentTypeId}
                                onChange={(event) =>
                                    setEquipmentTypeId(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    equipmentTypes.length === 0
                                }
                            >

                                <option value="">
                                    Select Equipment Type
                                </option>


                                {equipmentTypes.map(
                                    (equipment) => (

                                        <option
                                            key={equipment.id}
                                            value={equipment.id}
                                        >
                                            {equipment.name}
                                            {' - '}
                                            {equipment.category}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* ======================================
                            QUANTITY
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="quantity">
                                Quantity
                            </label>


                            <input
                                id="quantity"
                                type="number"
                                min="1"
                                step="1"
                                value={quantity}
                                onChange={(event) =>
                                    setQuantity(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter quantity"
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        SUBMIT
                    ========================================== */}

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={
                            submitting ||
                            bases.length < 2 ||
                            equipmentTypes.length === 0 ||
                            !sourceBaseId ||
                            !destinationBaseId
                        }
                    >

                        {submitting
                            ? 'Processing...'
                            : 'Create Transfer'}

                    </button>

                </form>

            </div>


            {/* ==================================================
                TRANSFER HISTORY
            ================================================== */}

            <div className="table-card">

                <div className="table-header">

                    <h2>
                        Transfer History
                    </h2>


                    <button
                        type="button"
                        className="secondary-button"
                        onClick={fetchTransfers}
                        disabled={loading}
                    >
                        Refresh
                    </button>

                </div>


                {loading ? (

                    <p className="table-message">
                        Loading transfers...
                    </p>

                ) : transfers.length === 0 ? (

                    <p className="table-message">
                        No transfers found.
                    </p>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>ID</th>
                                    <th>Source</th>
                                    <th>Destination</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                    <th>Status</th>
                                    <th>Initiated By</th>
                                    <th>Date</th>

                                </tr>

                            </thead>


                            <tbody>

                                {transfers.map(
                                    (transfer) => (

                                        <tr
                                            key={transfer.id}
                                        >

                                            <td>
                                                #{transfer.id}
                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        transfer.source_base_name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        transfer.source_base_location
                                                    }
                                                </small>

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        transfer.destination_base_name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        transfer.destination_base_location
                                                    }
                                                </small>

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        transfer.equipment_name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        transfer.equipment_category
                                                    }
                                                </small>

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        transfer.quantity
                                                    }
                                                </strong>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        transfer.status ===
                                                        'COMPLETED'
                                                            ? 'status-completed'
                                                            : 'status-default'
                                                    }
                                                >
                                                    {
                                                        transfer.status
                                                    }
                                                </span>

                                            </td>


                                            <td>
                                                {
                                                    transfer.initiated_by_username
                                                }
                                            </td>


                                            <td>

                                                {new Date(
                                                    transfer.timestamp
                                                ).toLocaleString()}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
};


// ============================================================
// DESTINATION BASES
// ============================================================

const getDestinationBases = (
    bases,
    userRole,
    userBaseId
) => {

    if (userRole === 'BASE_COMMANDER') {

        return bases.filter(
            (base) =>
                Number(base.id) !==
                Number(userBaseId)
        );

    }

    return bases;
};


// ============================================================
// DESTINATION AVAILABILITY
// ============================================================

const allBasesUnavailable = (
    bases,
    userRole
) => {

    if (userRole === 'BASE_COMMANDER') {
        return bases.length === 0;
    }

    return bases.length < 2;
};


export default Transfers;
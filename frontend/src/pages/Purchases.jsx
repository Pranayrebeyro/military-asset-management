import { useEffect, useState } from 'react';
import api from '../services/api.js';

const Purchases = () => {

    const [purchases, setPurchases] = useState([]);

    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    const [baseId, setBaseId] = useState('');
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
            const loggedInBaseId = user?.baseId ?? null;

            setUserRole(role);
            setUserBaseId(loggedInBaseId);


            // ------------------------------------------------
            // FILTER BASES BASED ON ROLE
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
            // BASE SELECTION
            // ------------------------------------------------

            if (
                role === 'BASE_COMMANDER' &&
                loggedInBaseId
            ) {

                setBaseId(
                    String(loggedInBaseId)
                );

            } else {

                setBaseId('');

            }


            // ------------------------------------------------
            // EQUIPMENT SELECTION
            // ------------------------------------------------

            setEquipmentTypeId('');

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
    // LOAD PURCHASE HISTORY
    // ========================================================

    const fetchPurchases = async () => {

        try {

            setLoading(true);

            const response =
                await api.get('/purchases');

            setPurchases(
                response.data.purchases || []
            );

        } catch (err) {

            console.error(
                'Failed to load purchases:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to load purchase history'
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
        fetchPurchases();

    }, []);


    // ========================================================
    // CREATE PURCHASE
    // ========================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError('');
        setSuccess('');


        // ----------------------------------------------------
        // Validate fields
        // ----------------------------------------------------

        if (
            !baseId ||
            !equipmentTypeId ||
            !quantity
        ) {

            setError(
                'Base, equipment type and quantity are required'
            );

            return;
        }


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
        // Extra frontend RBAC protection
        // ----------------------------------------------------

        if (
            userRole === 'BASE_COMMANDER' &&
            Number(baseId) !== Number(userBaseId)
        ) {

            setError(
                'You are not authorized to purchase for this base'
            );

            return;
        }


        try {

            setSubmitting(true);


            const response =
                await api.post(
                    '/purchases',
                    {
                        baseId: Number(baseId),

                        equipmentTypeId:
                            Number(equipmentTypeId),

                        quantity:
                            quantityNumber
                    }
                );


            setSuccess(
                response.data.message ||
                'Purchase completed successfully'
            );


            setQuantity('');


            // Refresh history
            await fetchPurchases();

        } catch (err) {

            console.error(
                'Purchase failed:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Purchase failed'
            );

        } finally {

            setSubmitting(false);
        }
    };


    // ========================================================
    // LOADING LOOKUPS
    // ========================================================

    if (loadingLookups) {

        return (
            <div className="management-page">

                <div className="page-header">

                    <div>

                        <h1>
                            Purchases
                        </h1>

                        <p>
                            Record and manage equipment purchases
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
                        Purchases
                    </h1>

                    <p>
                        Record and manage equipment purchases
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
                CREATE PURCHASE
            ================================================== */}

            <div className="form-card">

                <h2>
                    Create Purchase
                </h2>


                <form onSubmit={handleSubmit}>

                    <div className="form-grid">


                        {/* ======================================
                            BASE
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="base">
                                Base
                            </label>


                            <select
                                id="base"
                                value={baseId}
                                onChange={(event) =>
                                    setBaseId(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    bases.length === 0 ||
                                    userRole === 'BASE_COMMANDER'
                                }
                            >

                                {userRole === 'ADMIN' && (

                                    <option value="">
                                        Select Base
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


                            {userRole === 'BASE_COMMANDER' && (

                                <small>
                                    You can purchase only for your assigned base.
                                </small>

                            )}

                        </div>


                        {/* ======================================
                            EQUIPMENT TYPE
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="equipment">
                                Equipment Type
                            </label>


                            <select
                                id="equipment"
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
                            bases.length === 0 ||
                            equipmentTypes.length === 0 ||
                            !baseId
                        }
                    >

                        {submitting
                            ? 'Processing...'
                            : 'Create Purchase'}

                    </button>

                </form>

            </div>


            {/* ==================================================
                PURCHASE HISTORY
            ================================================== */}

            <div className="table-card">

                <div className="table-header">

                    <h2>
                        Purchase History
                    </h2>


                    <button
                        type="button"
                        className="secondary-button"
                        onClick={fetchPurchases}
                        disabled={loading}
                    >
                        Refresh
                    </button>

                </div>


                {loading ? (

                    <p className="table-message">
                        Loading purchases...
                    </p>

                ) : purchases.length === 0 ? (

                    <p className="table-message">
                        No purchases found.
                    </p>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        ID
                                    </th>

                                    <th>
                                        Base
                                    </th>

                                    <th>
                                        Equipment
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {purchases.map(
                                    (purchase) => (

                                        <tr
                                            key={purchase.id}
                                        >

                                            <td>
                                                #{purchase.id}
                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        purchase.base_name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        purchase.base_location
                                                    }
                                                </small>

                                            </td>


                                            <td>
                                                {
                                                    purchase.equipment_name
                                                }
                                            </td>


                                            <td>
                                                {
                                                    purchase.equipment_category
                                                }
                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        purchase.quantity
                                                    }
                                                </strong>

                                            </td>


                                            <td>

                                                {new Date(
                                                    purchase.created_at
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

export default Purchases;
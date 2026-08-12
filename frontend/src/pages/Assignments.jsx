import { useEffect, useState } from 'react';
import api from '../services/api.js';

const Assignments = () => {

    const [assignments, setAssignments] = useState([]);

    const [users, setUsers] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);

    const [userId, setUserId] = useState('');
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

            return JSON.parse(
                atob(
                    payload
                        .replace(/-/g, '+')
                        .replace(/_/g, '/')
                )
            );

        } catch (error) {

            console.error(
                'Failed to decode authentication token:',
                error
            );

            return null;
        }
    };


    // ========================================================
    // LOAD LOOKUPS
    // ========================================================

    const fetchLookups = async () => {

        try {

            setLoadingLookups(true);
            setError('');

            const [
                usersResponse,
                basesResponse,
                equipmentResponse
            ] = await Promise.all([
                api.get('/lookups/users'),
                api.get('/lookups/bases'),
                api.get('/lookups/equipment-types')
            ]);

            const allUsers =
                usersResponse.data.users || [];

            const allBases =
                basesResponse.data.bases || [];

            const equipmentList =
                equipmentResponse.data.equipmentTypes || [];


            // ------------------------------------------------
            // LOGGED-IN USER
            // ------------------------------------------------

            const loggedInUser =
                getLoggedInUser();

            const role =
                loggedInUser?.role || '';

            const loggedInBaseId =
                loggedInUser?.baseId ?? null;

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

                availableBases =
                    allBases.filter(
                        (base) =>
                            Number(base.id) ===
                            Number(loggedInBaseId)
                    );
            }


            setBases(availableBases);
            setEquipmentTypes(equipmentList);


            // ------------------------------------------------
            // DEFAULT BASE
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
            // FILTER USERS
            //
            // We need to inspect base_id returned by
            // /lookups/users.
            // ------------------------------------------------

            let availableUsers = allUsers;

            if (
                role === 'BASE_COMMANDER' &&
                loggedInBaseId
            ) {

                availableUsers =
                    allUsers.filter(
                        (user) =>
                            Number(user.base_id) ===
                            Number(loggedInBaseId)
                    );
            }

            setUsers(availableUsers);


            // ------------------------------------------------
            // DEFAULT USER
            // ------------------------------------------------

            if (availableUsers.length > 0) {

                setUserId(
                    String(availableUsers[0].id)
                );

            } else {

                setUserId('');

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
                'Failed to load users, bases and equipment types'
            );

        } finally {

            setLoadingLookups(false);
        }
    };


    // ========================================================
    // LOAD ASSIGNMENT HISTORY
    // ========================================================

    const fetchAssignments = async () => {

        try {

            setLoading(true);

            const response =
                await api.get('/assignments');

            setAssignments(
                response.data.assignments || []
            );

        } catch (err) {

            console.error(
                'Failed to load assignments:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to load assignment history'
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
        fetchAssignments();

    }, []);


    // ========================================================
    // CREATE ASSIGNMENT
    // ========================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError('');
        setSuccess('');


        // ----------------------------------------------------
        // Required fields
        // ----------------------------------------------------

        if (
            !userId ||
            !baseId ||
            !equipmentTypeId ||
            !quantity
        ) {

            setError(
                'All fields are required'
            );

            return;
        }


        // ----------------------------------------------------
        // Quantity validation
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
        // BASE COMMANDER RBAC
        // ----------------------------------------------------

        if (
            userRole === 'BASE_COMMANDER' &&
            Number(baseId) !==
                Number(userBaseId)
        ) {

            setError(
                'You are not authorized to assign assets from this base'
            );

            return;
        }


        // ----------------------------------------------------
        // Verify selected user belongs to selected base
        // ----------------------------------------------------

        const selectedUser =
            users.find(
                (user) =>
                    Number(user.id) ===
                    Number(userId)
            );


        if (
            selectedUser?.base_id !== undefined &&
            selectedUser?.base_id !== null &&
            Number(selectedUser.base_id) !==
                Number(baseId)
        ) {

            setError(
                'Selected user does not belong to the selected base'
            );

            return;
        }


        try {

            setSubmitting(true);

            const response =
                await api.post(
                    '/assignments',
                    {
                        userId:
                            Number(userId),

                        baseId:
                            Number(baseId),

                        equipmentTypeId:
                            Number(equipmentTypeId),

                        quantity:
                            quantityNumber
                    }
                );


            setSuccess(
                response.data.message ||
                'Assignment completed successfully'
            );


            setQuantity('');


            await fetchAssignments();

        } catch (err) {

            console.error(
                'Assignment failed:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Assignment failed'
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
                            Assignments
                        </h1>

                        <p>
                            Assign equipment to
                            military personnel
                        </p>

                    </div>

                </div>

                <div className="table-card">

                    <p className="table-message">
                        Loading users, bases and
                        equipment types...
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
                        Assignments
                    </h1>

                    <p>
                        Assign equipment to
                        military personnel
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
                CREATE ASSIGNMENT
            ================================================== */}

            <div className="form-card">

                <h2>
                    Create Assignment
                </h2>


                <form onSubmit={handleSubmit}>

                    <div className="form-grid">


                        {/* ======================================
                            USER
                        ====================================== */}

                        <div className="form-group">

                            <label htmlFor="user">
                                User
                            </label>


                            <select
                                id="user"
                                value={userId}
                                onChange={(event) =>
                                    setUserId(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    users.length === 0
                                }
                            >

                                <option value="">
                                    Select User
                                </option>


                                {users.map((user) => (

                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.username}
                                        {' - '}
                                        {user.role}
                                    </option>

                                ))}

                            </select>


                            {users.length === 0 && (

                                <small>
                                    No personnel available
                                    for this base.
                                </small>

                            )}

                        </div>


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
                                    userRole ===
                                        'BASE_COMMANDER'
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


                            {userRole ===
                                'BASE_COMMANDER' && (

                                <small>
                                    You can assign equipment
                                    only from your assigned base.
                                </small>

                            )}

                        </div>


                        {/* ======================================
                            EQUIPMENT
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
                            users.length === 0 ||
                            bases.length === 0 ||
                            equipmentTypes.length === 0 ||
                            !userId ||
                            !baseId
                        }
                    >

                        {submitting
                            ? 'Processing...'
                            : 'Create Assignment'}

                    </button>

                </form>

            </div>


            {/* ==================================================
                ASSIGNMENT HISTORY
            ================================================== */}

            <div className="table-card">

                <div className="table-header">

                    <h2>
                        Assignment History
                    </h2>


                    <button
                        type="button"
                        className="secondary-button"
                        onClick={fetchAssignments}
                        disabled={loading}
                    >
                        Refresh
                    </button>

                </div>


                {loading ? (

                    <p className="table-message">
                        Loading assignments...
                    </p>

                ) : assignments.length === 0 ? (

                    <p className="table-message">
                        No assignments found.
                    </p>

                ) : (

                    <div className="table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Base</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                    <th>Date</th>

                                </tr>

                            </thead>


                            <tbody>

                                {assignments.map(
                                    (assignment) => (

                                        <tr
                                            key={
                                                assignment.id
                                            }
                                        >

                                            <td>
                                                #{assignment.id}
                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        assignment.username
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        assignment.role
                                                    }
                                                </small>

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        assignment.base_name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        assignment.base_location
                                                    }
                                                </small>

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        assignment.equipment_name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        assignment.equipment_category
                                                    }
                                                </small>

                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        assignment.quantity
                                                    }
                                                </strong>

                                            </td>


                                            <td>

                                                {new Date(
                                                    assignment.assigned_at
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

export default Assignments;
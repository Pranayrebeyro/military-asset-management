import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            await login(username, password);

            navigate('/dashboard');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Invalid username or password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-header">
                    <h1>Military Asset Management</h1>
                    <p>Secure Management Portal</p>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Username</label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                </form>

            </div>
        </div>
    );
};

export default Login;

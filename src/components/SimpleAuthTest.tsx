import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SimpleAuthTest: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [username, setUsername] = useState(`user${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testSignup = async () => {
    setLoading(true);
    setResult('Starting simple signup test...');
    
    try {
      // Step 1: Create auth user
      setResult('Creating auth user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setResult(`❌ Auth error: ${error.message}`);
        return;
      }

      if (!data.user) {
        setResult('❌ No user returned from auth');
        return;
      }

      setResult(`✅ Auth user created: ${data.user.id}`);

      // Step 2: Create user profile
      setResult('Creating user profile...');
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          username: username,
        });
      
      if (profileError) {
        setResult(`❌ Profile error: ${profileError.message}`);
        return;
      }

      setResult('✅ User profile created');
      setResult('✅ SUCCESS: Signup completed!');

    } catch (error: any) {
      setResult(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async () => {
    setResult('Testing database connection...');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        setResult(`❌ Database error: ${error.message}`);
      } else {
        setResult('✅ Database connection successful');
      }
    } catch (error: any) {
      setResult(`❌ Connection failed: ${error.message}`);
    }
  };

  const generateUsername = () => {
    const newUsername = `user${Date.now()}`;
    setUsername(newUsername);
    setResult(`✅ Generated username: ${newUsername}`);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Simple Auth Test</h3>
      
      <div className="space-y-3 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
        />
        <div className="flex space-x-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={generateUsername}
            className="px-3 py-2 bg-gray-500 text-white rounded text-sm"
          >
            Generate
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testDatabase}
          className="w-full p-2 bg-gray-500 text-white rounded"
        >
          Test Database
        </button>
        
        <button
          onClick={testSignup}
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Signup'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default SimpleAuthTest; 
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthTest: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [username, setUsername] = useState(`testuser${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testSignup = async () => {
    setLoading(true);
    setResult('Starting signup test...');
    
    try {
      // Test 0: Check Supabase connection
      setResult('Testing Supabase connection...');
      const { data: connectionTest } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      setResult('✅ Supabase connection working');

      // Test 1: Check if username exists with timeout
      setResult('Checking username availability...');
      
      const usernameCheck = Promise.race([
        supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Username check timeout')), 5000)
        )
      ]);

      const { data: existingUser, error: checkError } = await usernameCheck as any;

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          setResult('✅ Username available (not found)');
        } else {
          setResult(`❌ Username check error: ${checkError.message}`);
          return;
        }
      } else if (existingUser) {
        setResult('❌ Username already taken');
        return;
      }

      // Test 2: Create auth user
      setResult('Creating auth user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
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

      // Test 3: Create user profile
      setResult('Creating user profile...');
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        setResult(`❌ Profile error: ${profileError.message}`);
        return;
      }

      setResult('✅ User profile created');

      // Test 4: Wait for trigger
      setResult('Waiting for trigger to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 5: Check if profiles were created
      setResult('Checking if profiles were created...');
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      const { data: gameStats } = await supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (userProfile && gameStats) {
        setResult('✅ SUCCESS: All profiles created successfully!');
      } else {
        setResult('⚠️ WARNING: Some profiles may not have been created');
      }

    } catch (error: any) {
      setResult(`❌ ERROR: ${error.message}`);
      console.error('Auth test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setResult('Testing database connection...');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        setResult(`❌ Connection error: ${error.message}`);
      } else {
        setResult('✅ Database connection successful');
      }
    } catch (error: any) {
      setResult(`❌ Connection failed: ${error.message}`);
    }
  };

  const generateUniqueUsername = () => {
    const newUsername = `testuser${Date.now()}`;
    setUsername(newUsername);
    setResult(`✅ Generated unique username: ${newUsername}`);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Auth Test</h3>
      
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
            onClick={generateUniqueUsername}
            className="px-3 py-2 bg-gray-500 text-white rounded text-sm"
          >
            Generate
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testConnection}
          className="w-full p-2 bg-gray-500 text-white rounded"
        >
          Test Connection
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

export default AuthTest; 
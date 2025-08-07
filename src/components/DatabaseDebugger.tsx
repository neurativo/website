import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DatabaseDebugger: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const runDebugTest = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🔍 Starting comprehensive database debug...');
      
      // Test 1: Basic connection
      addResult('Step 1: Testing basic connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        addResult(`❌ Connection error: ${connectionError.message}`);
        addResult(`❌ Error code: ${connectionError.code}`);
        addResult(`❌ Error details: ${JSON.stringify(connectionError)}`);
        return;
      } else {
        addResult('✅ Basic connection successful');
      }

      // Test 2: Check if users table exists
      addResult('Step 2: Checking users table...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('users')
        .select('*')
        .limit(0);
      
      if (tableError) {
        addResult(`❌ Table error: ${tableError.message}`);
        addResult(`❌ Table error code: ${tableError.code}`);
      } else {
        addResult('✅ Users table accessible');
      }

      // Test 3: Try to insert a test user
      addResult('Step 3: Testing user insertion...');
      const testUserId = `test-${Date.now()}`;
      const testEmail = `test${Date.now()}@example.com`;
      const testUsername = `testuser${Date.now()}`;
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: testEmail,
          username: testUsername,
        });
      
      if (insertError) {
        addResult(`❌ Insert error: ${insertError.message}`);
        addResult(`❌ Insert error code: ${insertError.code}`);
        addResult(`❌ Insert error details: ${JSON.stringify(insertError)}`);
      } else {
        addResult('✅ User insertion successful');
      }

      // Test 4: Check if the user was actually inserted
      addResult('Step 4: Verifying user was inserted...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      if (verifyError) {
        addResult(`❌ Verification error: ${verifyError.message}`);
      } else if (verifyData) {
        addResult('✅ User verification successful');
        addResult(`✅ User data: ${JSON.stringify(verifyData)}`);
      } else {
        addResult('❌ User was not found after insertion');
      }

      // Test 5: Test auth signup
      addResult('Step 5: Testing auth signup...');
      const authEmail = `auth${Date.now()}@example.com`;
      const authPassword = 'password123';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
        addResult(`❌ Auth error code: ${authError.code}`);
      } else if (authData.user) {
        addResult('✅ Auth signup successful');
        addResult(`✅ Auth user ID: ${authData.user.id}`);
        
        // Test 6: Try to create profile for auth user
        addResult('Step 6: Testing profile creation for auth user...');
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || '',
            username: `authuser${Date.now()}`,
          });
        
        if (profileError) {
          addResult(`❌ Profile creation error: ${profileError.message}`);
          addResult(`❌ Profile error code: ${profileError.code}`);
          addResult(`❌ Profile error details: ${JSON.stringify(profileError)}`);
        } else {
          addResult('✅ Profile creation successful');
        }
      } else {
        addResult('❌ No user returned from auth signup');
      }

    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`);
      addResult(`❌ Error stack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Database Debugger</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={runDebugTest}
          disabled={loading}
          className="w-full p-3 bg-red-500 text-white rounded"
        >
          {loading ? 'Running Debug Test...' : 'Run Comprehensive Debug Test'}
        </button>
        
        <button
          onClick={clearResults}
          className="w-full p-2 bg-gray-500 text-white rounded"
        >
          Clear Results
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-100 rounded p-4">
          <h4 className="font-bold mb-2">Debug Results:</h4>
          <div className="space-y-1 text-sm max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseDebugger; 
import React, { useState } from 'react';

const ConnectionTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🔍 Testing Supabase connection...');
      
      // Test 1: Import Supabase
      addResult('Step 1: Importing Supabase...');
      const { supabase } = await import('../lib/supabase');
      addResult('✅ Supabase imported successfully');
      
      // Test 2: Check environment variables
      addResult('Step 2: Checking environment variables...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        addResult('❌ VITE_SUPABASE_URL is missing or invalid');
        return;
      } else {
        addResult(`✅ VITE_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
      }
      
      if (!supabaseKey || supabaseKey === 'placeholder-key') {
        addResult('❌ VITE_SUPABASE_ANON_KEY is missing or invalid');
        return;
      } else {
        addResult(`✅ VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`);
      }

      // Test 3: Try a very simple query with timeout
      addResult('Step 3: Testing simple query with timeout...');
      
      const queryPromise = supabase
        .from('users')
        .select('count')
        .limit(1);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (error) {
        addResult(`❌ Query error: ${error.message}`);
        addResult(`❌ Error code: ${error.code}`);
        addResult(`❌ Error details: ${JSON.stringify(error)}`);
        
        // Try alternative approach
        addResult('Step 4: Trying alternative query...');
        try {
          const { data: altData, error: altError } = await supabase
            .from('users')
            .select('*')
            .limit(0);
          
          if (altError) {
            addResult(`❌ Alternative query error: ${altError.message}`);
          } else {
            addResult('✅ Alternative query successful');
          }
        } catch (altErr: any) {
          addResult(`❌ Alternative query failed: ${altErr.message}`);
        }
      } else {
        addResult('✅ Simple query successful');
        addResult(`✅ Data received: ${JSON.stringify(data)}`);
      }
      
    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`);
      addResult(`❌ Error type: ${typeof error}`);
      addResult(`❌ Error stack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testBasicFetch = async () => {
    setResults([]);
    addResult('🔍 Testing basic fetch to Supabase...');
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        addResult('❌ Missing environment variables');
        return;
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      addResult(`✅ Fetch response status: ${response.status}`);
      addResult(`✅ Fetch response ok: ${response.ok}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addResult(`❌ Fetch error: ${errorText}`);
      } else {
        const data = await response.json();
        addResult(`✅ Fetch successful: ${JSON.stringify(data)}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Fetch error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Connection Test</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full p-3 bg-blue-500 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test Supabase Connection'}
        </button>
        
        <button
          onClick={testBasicFetch}
          className="w-full p-3 bg-green-500 text-white rounded"
        >
          Test Basic Fetch
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-100 rounded p-4">
          <h4 className="font-bold mb-2">Test Results:</h4>
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

export default ConnectionTest; 
import React, { useState } from 'react';

const SimpleTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const runSimpleTest = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🔍 Starting simple database test...');
      
      // Test 1: Import Supabase
      addResult('🔍 Importing Supabase...');
      const { supabase } = await import('../lib/supabase');
      addResult('✅ Supabase imported');
      
      // Test 2: Try a very simple query
      addResult('🔍 Testing simple query...');
      const { data, error } = await supabase
        .from('test_table')
        .select('*')
        .limit(1);
      
      if (error) {
        addResult(`❌ Query error: ${error.message}`);
        addResult(`❌ Error code: ${error.code}`);
        
        // Try to create the table via RPC
        addResult('🔍 Trying to create test table...');
        try {
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql: 'CREATE TABLE IF NOT EXISTS public.test_table (id SERIAL PRIMARY KEY, name TEXT);'
          });
          
          if (createError) {
            addResult(`❌ Create table error: ${createError.message}`);
          } else {
            addResult('✅ Test table created');
          }
        } catch (rpcError: any) {
          addResult(`❌ RPC error: ${rpcError.message}`);
        }
      } else {
        addResult('✅ Simple query successful');
        addResult(`✅ Data: ${JSON.stringify(data)}`);
      }
      
      // Test 3: Try users table
      addResult('🔍 Testing users table...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (userError) {
        addResult(`❌ Users table error: ${userError.message}`);
      } else {
        addResult('✅ Users table accessible');
        addResult(`✅ User data: ${JSON.stringify(userData)}`);
      }
      
    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`);
      console.error('Simple test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Simple Database Test</h3>
      
      <button
        onClick={runSimpleTest}
        disabled={loading}
        className="w-full p-3 bg-green-500 text-white rounded mb-4"
      >
        {loading ? 'Testing...' : 'Run Simple Test'}
      </button>

      {results.length > 0 && (
        <div className="bg-gray-100 rounded p-4">
          <h4 className="font-bold mb-2">Results:</h4>
          <div className="space-y-1 text-sm">
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

export default SimpleTest; 
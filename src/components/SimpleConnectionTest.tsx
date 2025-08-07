import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SimpleConnectionTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const testSimpleQuery = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🔍 Testing simple query after fix...');
      
      // Test 1: Simple count query
      addResult('Step 1: Testing count query...');
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        addResult(`❌ Count query error: ${error.message}`);
        addResult(`❌ Error code: ${error.code}`);
      } else {
        addResult('✅ Count query successful');
        addResult(`✅ Data: ${JSON.stringify(data)}`);
      }

      // Test 2: Simple select query
      addResult('Step 2: Testing select query...');
      const { data: selectData, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (selectError) {
        addResult(`❌ Select query error: ${selectError.message}`);
      } else {
        addResult('✅ Select query successful');
        addResult(`✅ Users found: ${selectData?.length || 0}`);
      }

      // Test 3: Test insert
      addResult('Step 3: Testing insert...');
      const testId = `test-${Date.now()}`;
      const testEmail = `test${Date.now()}@example.com`;
      const testUsername = `testuser${Date.now()}`;
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: testId,
          email: testEmail,
          username: testUsername,
        });
      
      if (insertError) {
        addResult(`❌ Insert error: ${insertError.message}`);
        addResult(`❌ Insert error code: ${insertError.code}`);
      } else {
        addResult('✅ Insert successful');
        
        // Test 4: Verify insert
        addResult('Step 4: Verifying insert...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('*')
          .eq('id', testId)
          .single();
        
        if (verifyError) {
          addResult(`❌ Verification error: ${verifyError.message}`);
        } else {
          addResult('✅ Verification successful');
          addResult(`✅ Inserted user: ${JSON.stringify(verifyData)}`);
        }
      }

    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Simple Connection Test</h3>
      
      <button
        onClick={testSimpleQuery}
        disabled={loading}
        className="w-full p-3 bg-green-500 text-white rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test Simple Query'}
      </button>

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

export default SimpleConnectionTest; 
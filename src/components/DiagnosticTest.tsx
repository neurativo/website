import React, { useState } from 'react';

const DiagnosticTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    
    // Test 1: Check environment variables
    addResult('🔍 Checking environment variables...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      addResult('❌ VITE_SUPABASE_URL is missing or invalid');
    } else {
      addResult(`✅ VITE_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
    }
    
    if (!supabaseKey || supabaseKey === 'placeholder-key') {
      addResult('❌ VITE_SUPABASE_ANON_KEY is missing or invalid');
    } else {
      addResult(`✅ VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`);
    }

    // Test 2: Try to import Supabase
    addResult('🔍 Testing Supabase import...');
    try {
      const { supabase } = await import('../lib/supabase');
      addResult('✅ Supabase client imported successfully');
      
      // Test 3: Try a simple query with timeout
      addResult('🔍 Testing database connection...');
      
      const connectionTest = Promise.race([
        supabase
          .from('users')
          .select('count')
          .limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ]);

      const { data, error } = await connectionTest as any;
      
      if (error) {
        addResult(`❌ Database error: ${error.message}`);
        addResult(`❌ Error code: ${error.code}`);
        addResult(`❌ Error details: ${JSON.stringify(error)}`);
        
        // Try a different approach
        addResult('🔍 Trying alternative connection test...');
        try {
          const { data: altData, error: altError } = await supabase
            .from('subscription_plans')
            .select('count')
            .limit(1);
          
          if (altError) {
            addResult(`❌ Alternative test failed: ${altError.message}`);
          } else {
            addResult('✅ Alternative connection successful');
          }
        } catch (altErr: any) {
          addResult(`❌ Alternative test error: ${altErr.message}`);
        }
      } else {
        addResult('✅ Database connection successful');
        addResult(`✅ Data received: ${JSON.stringify(data)}`);
      }
      
    } catch (error: any) {
      addResult(`❌ Import error: ${error.message}`);
    }

    // Test 4: Check if we're in development
    addResult('🔍 Checking environment...');
    addResult(`✅ Mode: ${import.meta.env.MODE}`);
    addResult(`✅ Base URL: ${import.meta.env.BASE_URL}`);
    
    // Test 5: Check other environment variables
    addResult('🔍 Checking other environment variables...');
    const envVars = [
      'VITE_OPENAI_API_KEY',
      'VITE_CLAUDE_API_KEY', 
      'VITE_GEMINI_API_KEY',
      'VITE_AIMLAPI_API_KEY',
      'VITE_ACTIVE_AI_PROVIDER'
    ];
    
    envVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (value) {
        addResult(`✅ ${varName}: ${value.substring(0, 10)}...`);
      } else {
        addResult(`❌ ${varName}: Not set`);
      }
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Diagnostic Test</h3>
      
      <button
        onClick={runDiagnostics}
        className="w-full p-3 bg-blue-500 text-white rounded mb-4"
      >
        Run Diagnostics
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

export default DiagnosticTest; 
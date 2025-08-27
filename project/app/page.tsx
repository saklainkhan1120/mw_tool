'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, Database, CheckCircle, Settings, Play, Eye, RotateCcw, Zap } from 'lucide-react';

// Simple Button Component
const Button = ({ children, onClick, variant = 'default', disabled = false, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Simple Card Components
const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 p-6">
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-2xl font-semibold leading-none tracking-tight">
    {children}
  </h3>
);

const CardDescription = ({ children }) => (
  <p className="text-sm text-gray-600">
    {children}
  </p>
);

const CardContent = ({ children }) => (
  <div className="p-6 pt-0">
    {children}
  </div>
);

// Simple Badge Component
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
    {children}
  </span>
);

// Simple Progress Component
const Progress = ({ value }) => (
  <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
    <div 
      className="h-full w-full flex-1 bg-blue-600 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

// Simple Select Component
const Select = ({ value, onValueChange, children }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </select>
  );
};

const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

// Simple Alert Component
const Alert = ({ children, className = '' }) => (
  <div className={`relative w-full rounded-lg border p-4 ${className}`}>
    {children}
  </div>
);

const AlertDescription = ({ children }) => (
  <div className="text-sm">
    {children}
  </div>
);

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fieldMappings, setFieldMappings] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const targetFields = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'company', label: 'Company' },
    { id: 'amount', label: 'Amount' },
    { id: 'date', label: 'Date' },
    { id: 'skip', label: 'Skip Field' }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadedFile(file);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setError('File is empty');
        return;
      }

      // Parse CSV
      const fileHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        fileHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }

      setHeaders(fileHeaders);
      setPreviewData(data);
      
      // Auto-map fields
      const mappings = fileHeaders.map(header => {
        const lowerHeader = header.toLowerCase();
        let target = 'skip';
        
        if (lowerHeader.includes('name')) target = 'name';
        else if (lowerHeader.includes('email')) target = 'email';
        else if (lowerHeader.includes('phone')) target = 'phone';
        else if (lowerHeader.includes('company')) target = 'company';
        else if (lowerHeader.includes('amount')) target = 'amount';
        else if (lowerHeader.includes('date')) target = 'date';

        return {
          source: header,
          target,
          mapped: target !== 'skip'
        };
      });

      setFieldMappings(mappings);
      setCurrentStep('preview');
    } catch (error) {
      setError('Failed to parse file. Please check the format.');
    }
  };

  const handleMappingChange = (sourceField, targetField) => {
    setFieldMappings(prev => prev.map(mapping => 
      mapping.source === sourceField 
        ? { ...mapping, target: targetField, mapped: targetField !== 'skip' }
        : mapping
    ));
  };

  const processData = () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          
          // Process data
          const processed = previewData.map(row => {
            const newRow = {};
            fieldMappings.forEach(mapping => {
              if (mapping.mapped && mapping.target !== 'skip') {
                newRow[mapping.target] = row[mapping.source] || '';
              }
            });
            return newRow;
          });
          
          setProcessedData(processed);
          setCurrentStep('export');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const downloadFile = () => {
    if (processedData.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      const mappedFields = fieldMappings
        .filter(m => m.mapped && m.target !== 'skip')
        .map(m => m.target);

      let content = '';
      let filename = '';
      let mimeType = '';

      if (exportFormat === 'csv') {
        const csvHeaders = mappedFields.join(',');
        const csvRows = processedData.map(row => 
          mappedFields.map(field => row[field] || '').join(',')
        ).join('\n');
        
        content = csvHeaders + '\n' + csvRows;
        filename = `data_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (exportFormat === 'json') {
        content = JSON.stringify(processedData, null, 2);
        filename = `data_${Date.now()}.json`;
        mimeType = 'application/json';
      }

      // Download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setError('');
    } catch (error) {
      setError('Failed to export file');
    }
  };

  const resetTool = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setPreviewData([]);
    setHeaders([]);
    setFieldMappings([]);
    setProcessedData([]);
    setProgress(0);
    setIsProcessing(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mighty Warner</h1>
                <p className="text-sm text-gray-500">Free Data Processing Tool</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              100% Free
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Data Processing Tool
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Upload CSV files, map fields, and export in any format. Completely free!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 max-w-4xl mx-auto border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Select a CSV file to process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <div className="space-y-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  <p className="text-gray-500">CSV files only</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {currentStep === 'preview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  File: {uploadedFile?.name} • {previewData.length} rows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        {headers.map((header, index) => (
                          <th key={index} className="border border-gray-200 p-3 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {headers.map((header, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-200 p-3">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Field Mapping</CardTitle>
                <CardDescription>
                  Map your fields to target columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full bg-blue-100"></div>
                        <div>
                          <p className="font-medium">{mapping.source}</p>
                          <p className="text-sm text-gray-500">Source field</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Select 
                          value={mapping.target} 
                          onValueChange={(value) => handleMappingChange(mapping.source, value)}
                        >
                          {targetFields.map(field => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </Select>
                        <Badge className={mapping.mapped ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {mapping.mapped ? 'Mapped' : 'Skip'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button variant="outline" onClick={resetTool}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                  <Button onClick={processData}>
                    <Play className="w-4 h-4 mr-2" />
                    Process Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 'processing' && (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Settings className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">Processing Data</h2>
                  <p className="text-gray-600">Please wait...</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Export */}
        {currentStep === 'export' && (
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Processing Complete!
              </CardTitle>
              <CardDescription>
                Your data is ready for export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <strong>{processedData.length}</strong> records processed successfully
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Choose Export Format:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      exportFormat === 'csv' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium">CSV File</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all ${
                      exportFormat === 'json' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setExportFormat('json')}
                  >
                    <CardContent className="p-4 text-center">
                      <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium">JSON File</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button variant="outline" onClick={resetTool}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New File
                </Button>
                <Button onClick={downloadFile}>
                  <Download className="w-4 h-4 mr-2" />
                  Download {exportFormat.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
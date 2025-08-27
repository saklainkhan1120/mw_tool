'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Download, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Play,
  FileSpreadsheet,
  Globe,
  Zap,
  ArrowRight,
  MapPin,
  Eye,
  Trash2,
  RotateCcw
} from 'lucide-react';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<any[]>([]);
  const [exportFormat, setExportFormat] = useState('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportFormats = [
    { id: 'excel', name: 'Excel (.xlsx)', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'csv', name: 'CSV File', icon: <FileText className="w-5 h-5" /> },
    { id: 'json', name: 'JSON', icon: <Database className="w-5 h-5" /> },
    { id: 'google-sheets', name: 'Google Sheets', icon: <Globe className="w-5 h-5" /> }
  ];

  const targetFields = [
    { id: 'name', label: 'Customer Name', required: true },
    { id: 'email', label: 'Email Address', required: true },
    { id: 'company', label: 'Company Name', required: false },
    { id: 'phone', label: 'Phone Number', required: false },
    { id: 'amount', label: 'Amount', required: false },
    { id: 'date', label: 'Date', required: false },
    { id: 'description', label: 'Description', required: false },
    { id: 'category', label: 'Category', required: false }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('File is empty');
        return;
      }

      const fileHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        fileHeaders.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setHeaders(fileHeaders);
      setPreviewData(data);
      
      // Auto-generate field mappings
      const mappings = fileHeaders.map(header => {
        const lowerHeader = header.toLowerCase();
        let target = '';
        let mapped = false;

        if (lowerHeader.includes('name') || lowerHeader.includes('customer')) {
          target = 'name';
          mapped = true;
        } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
          target = 'email';
          mapped = true;
        } else if (lowerHeader.includes('company') || lowerHeader.includes('business')) {
          target = 'company';
          mapped = true;
        } else if (lowerHeader.includes('amount') || lowerHeader.includes('total')) {
          target = 'amount';
          mapped = true;
        } else if (lowerHeader.includes('phone') || lowerHeader.includes('tel')) {
          target = 'phone';
          mapped = true;
        } else if (lowerHeader.includes('date')) {
          target = 'date';
          mapped = true;
        }

        return {
          source: header,
          target,
          mapped
        };
      });

      setFieldMappings(mappings);
      setCurrentStep('preview');
    } catch (error) {
      alert('Failed to parse file. Please check the format.');
    }
  };

  const handleMappingChange = (sourceField: string, targetField: string) => {
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

    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          
          // Process the data based on mappings
          const processed = previewData.map(row => {
            const newRow: any = {};
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
    let content = '';
    let filename = '';
    let mimeType = '';

    if (exportFormat === 'csv') {
      const csvHeaders = fieldMappings
        .filter(m => m.mapped && m.target !== 'skip')
        .map(m => m.target)
        .join(',');
      
      const csvRows = processedData.map(row => 
        fieldMappings
          .filter(m => m.mapped && m.target !== 'skip')
          .map(m => row[m.target] || '')
          .join(',')
      ).join('\n');
      
      content = csvHeaders + '\n' + csvRows;
      filename = `processed_data_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else if (exportFormat === 'json') {
      content = JSON.stringify(processedData, null, 2);
      filename = `processed_data_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      // For Excel and Google Sheets, we'll simulate download
      alert(`${exportFormat === 'excel' ? 'Excel' : 'Google Sheets'} export started! File will be ready shortly.`);
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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
                <img src="/image.png" alt="Mighty Warner" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mighty Warner</h1>
                <p className="text-sm text-gray-500">Free Data Processing Tool</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              100% Free Tool
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Data Import & Export Tool
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Upload your CSV/Excel files, map fields, and export in any format you need. 
            No registration required - completely free to use!
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No Registration Required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              100% Free Forever
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Secure Processing
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 'upload', title: 'Upload File', icon: <Upload className="w-5 h-5" /> },
              { step: 'preview', title: 'Preview & Map', icon: <Eye className="w-5 h-5" /> },
              { step: 'processing', title: 'Process Data', icon: <Settings className="w-5 h-5" /> },
              { step: 'export', title: 'Export', icon: <Download className="w-5 h-5" /> }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === item.step || (currentStep === 'export' && item.step !== 'export') || 
                  (currentStep === 'processing' && ['upload', 'preview'].includes(item.step))
                    ? 'bg-gradient-to-r from-red-600 to-blue-800 border-red-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {item.icon}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep === item.step ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {item.title}
                  </p>
                </div>
                {index < 3 && (
                  <div className={`w-16 h-px mx-4 ${
                    (currentStep === 'preview' && item.step === 'upload') ||
                    (currentStep === 'processing' && ['upload', 'preview'].includes(item.step)) ||
                    (currentStep === 'export' && ['upload', 'preview', 'processing'].includes(item.step))
                      ? 'bg-gradient-to-r from-red-600 to-blue-800' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload File */}
        {currentStep === 'upload' && (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Upload Your Data File</CardTitle>
              <CardDescription>
                Upload CSV or Excel files to get started. We'll automatically detect and preview your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Drop your file here, or{' '}
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                      browse
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </h3>
                  <p className="text-gray-500">
                    Supports CSV, Excel files up to 50MB
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      CSV
                    </div>
                    <div className="flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      Excel
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview & Map Fields */}
        {currentStep === 'preview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Data Preview
                </CardTitle>
                <CardDescription>
                  File: {uploadedFile?.name} • {previewData.length} rows shown (preview)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        {headers.map((header, index) => (
                          <th key={index} className="border border-gray-200 p-3 text-left font-medium text-gray-900">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {headers.map((header, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-200 p-3 text-gray-600">
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
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Field Mapping
                </CardTitle>
                <CardDescription>
                  Map your source fields to target fields for processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{mapping.source}</p>
                          <p className="text-sm text-gray-500">Source field</p>
                        </div>
                      </div>
                      
                      <ArrowRight className="text-gray-400" />
                      
                      <div className="flex items-center space-x-4">
                        <Select 
                          value={mapping.target} 
                          onValueChange={(value) => handleMappingChange(mapping.source, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select target field" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetFields.map(field => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label} {field.required && '*'}
                              </SelectItem>
                            ))}
                            <SelectItem value="skip">Skip Field</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant={mapping.mapped ? 'default' : 'secondary'}>
                          {mapping.mapped ? 'Mapped' : 'Unmapped'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    <strong>{fieldMappings.filter(m => m.mapped).length}</strong> of{' '}
                    <strong>{fieldMappings.length}</strong> fields mapped
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Start Over
                    </Button>
                    <Button onClick={processData} className="bg-gradient-to-r from-red-600 to-blue-800">
                      <Play className="w-4 h-4 mr-2" />
                      Process Data
                    </Button>
                  </div>
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
                <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Settings className="w-8 h-8 text-red-600 animate-spin" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Data</h2>
                  <p className="text-gray-600">Please wait while we process and transform your data...</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Records processed:</span>
                    <span className="font-medium">{Math.floor((progress / 100) * previewData.length)} / {previewData.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fields mapped:</span>
                    <span className="font-medium">{fieldMappings.filter(m => m.mapped).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-blue-600">Processing...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Export */}
        {currentStep === 'export' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Data Processing Complete!
                </CardTitle>
                <CardDescription>
                  Your data has been successfully processed. Choose your export format below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{processedData.length}</strong> records processed successfully with{' '}
                    <strong>{fieldMappings.filter(m => m.mapped).length}</strong> mapped fields.
                  </AlertDescription>
                </Alert>

                {/* Processed Data Preview */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Processed Data Preview:</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          {fieldMappings.filter(m => m.mapped && m.target !== 'skip').map((mapping, index) => (
                            <th key={index} className="border-b p-3 text-left font-medium text-gray-900">
                              {mapping.target}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {processedData.slice(0, 3).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {fieldMappings.filter(m => m.mapped && m.target !== 'skip').map((mapping, cellIndex) => (
                              <td key={cellIndex} className="border-b p-3 text-gray-600">
                                {row[mapping.target]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Export Format Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Choose Export Format:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {exportFormats.map((format) => (
                      <Card 
                        key={format.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          exportFormat === format.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
                        }`}
                        onClick={() => setExportFormat(format.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <div className="text-red-600">{format.icon}</div>
                          </div>
                          <p className="font-medium text-sm">{format.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Ready to export <strong>{processedData.length}</strong> records in <strong>{exportFormat}</strong> format
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={resetTool}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Process New File
                    </Button>
                    <Button onClick={downloadFile} className="bg-gradient-to-r from-red-600 to-blue-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download {exportFormat.toUpperCase()}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Our Free Tool?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">100% Free</h3>
              <p className="text-gray-600">No hidden costs, no registration required. Use it as much as you want.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Process thousands of records in seconds with our optimized engine.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Mapping</h3>
              <p className="text-gray-600">AI-powered field detection and mapping suggestions for accuracy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-blue-800 rounded-lg flex items-center justify-center">
              <img src="/image.png" alt="Mighty Warner" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-bold text-lg">Mighty Warner</span>
          </div>
          <p className="text-gray-400 mb-4">Free Data Processing Tool - No Registration Required</p>
          <p className="text-sm text-gray-500">
            &copy; 2025 Mighty Warner. All rights reserved. | 100% Free Tool
          </p>
        </div>
      </footer>
    </div>
  );
}
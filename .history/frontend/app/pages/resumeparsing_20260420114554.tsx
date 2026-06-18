"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ParsedData {
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  skills: string[];
  education: string;
}

export function ResumeParsing() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('Resume Parsing', 'write');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: !canWrite,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const handleFileUpload = async (file: File) => {
    setParsing(true);
    setParsedData(null);

    // Simulate AI parsing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock parsed data
    const mockParsedData: ParsedData = {
      name: 'Jennifer Anderson',
      email: 'jennifer.anderson@email.com',
      phone: '+1 (555) 678-9012',
      position: 'Full Stack Developer',
      experience: '6 years',
      skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker'],
      education: 'BS Computer Science - UC Berkeley',
    };

    setParsedData(mockParsedData);
    setParsing(false);
    toast.success('Resume parsed successfully!');
  };

  const handleSave = () => {
    if (parsedData) {
      toast.success('Candidate profile saved successfully!');
      setParsedData(null);
    }
  };

  if (!hasPermission('Resume Parsing', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don't have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resume Parsing</h1>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            {canWrite
              ? 'Upload a PDF or Word document to parse candidate information'
              : 'You have read-only access to this feature'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${!canWrite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Parsing resume...</p>
                <p className="text-sm text-muted-foreground">Using AI to extract information</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a resume here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (PDF, DOC, DOCX)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsed Data */}
      {parsedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>Parsed Information</CardTitle>
            </div>
            <CardDescription>Review and edit the extracted information before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={parsedData.name} readOnly={!canWrite} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={parsedData.email} readOnly={!canWrite} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={parsedData.phone} readOnly={!canWrite} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={parsedData.position} readOnly={!canWrite} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input id="experience" value={parsedData.experience} readOnly={!canWrite} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input id="education" value={parsedData.education} readOnly={!canWrite} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {canWrite && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setParsedData(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <FileText className="mr-2 h-4 w-4" />
                  Save to Database
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

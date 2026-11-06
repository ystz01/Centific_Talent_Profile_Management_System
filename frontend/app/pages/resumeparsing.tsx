"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, FileText, Loader2, Pencil, Plus, Save, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WorkHistoryEntry {
  role: string;
  company: string;
  duration: string;
}

interface ProjectInfo {
  title: string;
  description: string;
}

interface ParsedData {
  name: string;
  email: string;
  phone: string;
  location: string;
  education_level: string;
  highest_education: string;
  skills: string[];
  work_history: WorkHistoryEntry[];
  years_of_experience: number;
  linkedin: string;
  github: string;
  languages: string[];
  projects: ProjectInfo[];
  leadership_activities: string[];
  awards: string[];
  resume_url: string;
  candidate_id: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiBaseUrl = apiUrl?.replace(/\/+$/, '');
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const projectList = (value: unknown): ProjectInfo[] =>
  Array.isArray(value)
    ? value
      .filter((project): project is Record<string, unknown> => typeof project === 'object' && project !== null)
      .map((project) => ({
        title: typeof project.title === 'string' ? project.title : '',
        description: typeof project.description === 'string' ? project.description : '',
      }))
    : [];

async function readApiResponse(response: Response): Promise<Record<string, unknown>> {
  const responseText = await response.text();
  let result: Record<string, unknown> = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      if (!response.ok) {
        throw new Error(responseText.slice(0, 300));
      }
      throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok) {
    const detail = typeof result.detail === 'string' ? result.detail : undefined;
    throw new Error(detail || `Request failed with status ${response.status}.`);
  }

  return result;
}

export function ResumeParsing() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('Resume Parsing', 'write');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [leadershipInput, setLeadershipInput] = useState('');
  const [awardsInput, setAwardsInput] = useState('');
  const [fileError, setFileError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      //'application/msword': ['.doc'],
      //'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: MAX_RESUME_SIZE,
    disabled: !canWrite || parsing,
    onDrop: (acceptedFiles, fileRejections) => {
      const isTooLarge = fileRejections.some((rejection) =>
        rejection.errors.some((error) => error.code === 'file-too-large')
      );

      setFileError(isTooLarge ? 'The file is too large, The maximum size is 5MB' : '');

      if (acceptedFiles.length > 0) {
        void handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_RESUME_SIZE) {
      setFileError('The file is too large, The maximum size is 5MB');
      return;
    }

    setFileError('');
    setParsing(true);
    setParsedData(null);
    setEditing(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured.');
      }

      const response = await fetch(`${apiBaseUrl}/api/upload-and-parse-resume`, {
        method: 'POST',
        body: formData,
      });
      const result = await readApiResponse(response);

      const data = result.data as Record<string, unknown>;
      setParsedData({
        name: typeof data.name === 'string' ? data.name : '',
        email: typeof data.email === 'string' ? data.email : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        location: typeof data.location === 'string' ? data.location : '',
        education_level: typeof data.education_level === 'string' ? data.education_level : '',
        highest_education: typeof data.highest_education === 'string' ? data.highest_education : '',
        skills: stringList(data.skills),
        work_history: Array.isArray(data.work_history) ? data.work_history as WorkHistoryEntry[] : [],
        years_of_experience: Number(data.years_of_experience) || 0,
        linkedin: typeof data.linkedin === 'string' ? data.linkedin : '',
        github: typeof data.github === 'string' ? data.github : '',
        languages: stringList(data.languages),
        projects: projectList(data.projects),
        leadership_activities: stringList(data.leadership_activities),
        awards: stringList(data.awards),
        resume_url: typeof data.resume_url === 'string' ? data.resume_url : '',
        candidate_id: typeof result.candidate_id === 'string' ? result.candidate_id : '',
      });
      setSkillsInput(stringList(data.skills).join(', '));
      toast.success('Resume parsed and saved to database!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error parsing resume.');
    } finally {
      setParsing(false);
    }
  };

  const updateField = <K extends keyof ParsedData>(field: K, value: ParsedData[K]) => {
    setParsedData((previous) => previous ? { ...previous, [field]: value } : previous);
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistoryEntry, value: string) => {
    if (!parsedData) return;
    const workHistory = parsedData.work_history.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    );
    updateField('work_history', workHistory);
  };

  const handleSave = async () => {
    if (!parsedData) return;
    setSaving(true);

    try {
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured.');
      }

      const languages = languagesInput.split(',').map((item) => item.trim()).filter(Boolean);
      const leadershipActivities = leadershipInput.split(',').map((item) => item.trim()).filter(Boolean);
      const awards = awardsInput.split(',').map((item) => item.trim()).filter(Boolean);
      const response = await fetch(`${apiBaseUrl}/api/candidates/${parsedData.candidate_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedData.name,
          email: parsedData.email,
          phone: parsedData.phone,
          location: parsedData.location,
          education_level: parsedData.education_level,
          highest_education: parsedData.highest_education,
          skills: skillsInput.split(',').map((skill) => skill.trim()).filter(Boolean),
          work_history: parsedData.work_history,
          years_of_experience: parsedData.years_of_experience,
          linkedin: parsedData.linkedin || null,
          github: parsedData.github || null,
          languages,
          projects: parsedData.projects,
          leadership_activities: leadershipActivities,
          awards,
        }),
      });
      await readApiResponse(response);

      setParsedData({
        ...parsedData,
        skills: skillsInput.split(',').map((item) => item.trim()).filter(Boolean),
        languages,
        leadership_activities: leadershipActivities,
        awards,
      });
      setEditing(false);
      toast.success('Candidate changes saved.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error saving candidate changes.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    if (!parsedData) return;
    setSkillsInput(parsedData.skills.join(', '));
    setLanguagesInput(parsedData.languages.join(', '));
    setLeadershipInput(parsedData.leadership_activities.join(', '));
    setAwardsInput(parsedData.awards.join(', '));
    setEditing(true);
  };

  if (!hasPermission('Resume Parsing', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resume Parsing</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            {canWrite
              ? 'Upload a PDF to parse candidate information (Max 5MB)'
              : 'You have read-only access to this feature'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
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
                  <p className="text-sm text-muted-foreground mt-1">or click to browse (PDF)</p>
                </div>
              </div>
            )}
          </div>
          {fileError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {fileError}
            </p>
          )}
        </CardContent>
      </Card>

      {parsedData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle>Candidate Preview</CardTitle>
                </div>
                {canWrite && !editing && (
                  <Button variant="outline" onClick={startEditing}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>
                {editing ? 'Correct the extracted details, then keep your changes.' : 'Review the details saved to the candidates collection.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {([
                      ['Name', 'name'],
                      ['Email', 'email'],
                      ['Phone', 'phone'],
                      ['Location', 'location'],
                      ['Education level', 'education_level'],
                      ['Highest education', 'highest_education'],
                      ['Years of experience', 'years_of_experience'],
                      ['LinkedIn', 'linkedin'],
                      ['GitHub', 'github'],
                    ] as const).map(([label, field]) => (
                      <tr key={field}>
                        <th className="w-2/5 bg-muted/50 px-4 py-3 text-left font-medium">{label}</th>
                        <td className="px-4 py-3">
                          {editing ? (
                            <Input
                              type={field === 'years_of_experience' ? 'number' : field === 'email' ? 'email' : 'text'}
                              step={field === 'years_of_experience' ? '0.1' : undefined}
                              value={parsedData[field]}
                              onChange={(event) => updateField(
                                field,
                                field === 'years_of_experience' ? Number(event.target.value) : event.target.value
                              )}
                            />
                          ) : (
                            String(parsedData[field])
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <th className="bg-muted/50 px-4 py-3 text-left font-medium align-top">Skills</th>
                      <td className="px-4 py-3">
                        {editing ? (
                          <Textarea
                            value={skillsInput}
                            onChange={(event) => setSkillsInput(event.target.value)}
                            placeholder="React, TypeScript, SQL"
                          />
                        ) : (
                          parsedData.skills.length > 0 ? parsedData.skills.join(', ') : '—'
                        )}
                      </td>
                    </tr>
                    {([
                      ['Languages', 'languages', languagesInput, setLanguagesInput],
                      ['Leadership activities', 'leadership_activities', leadershipInput, setLeadershipInput],
                      ['Awards', 'awards', awardsInput, setAwardsInput],
                    ] as const).map(([label, field, inputValue, setInputValue]) => (
                      <tr key={field}>
                        <th className="bg-muted/50 px-4 py-3 text-left font-medium align-top">{label}</th>
                        <td className="px-4 py-3">
                          {editing ? (
                            <Textarea
                              value={inputValue}
                              onChange={(event) => setInputValue(event.target.value)}
                              placeholder="Separate items with commas"
                            />
                          ) : (
                            parsedData[field].length > 0 ? parsedData[field].join(', ') : '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Projects</Label>
                  {editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateField('projects', [
                        ...parsedData.projects,
                        { title: '', description: '' },
                      ])}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  )}
                </div>
                {parsedData.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects extracted.</p>}
                {parsedData.projects.map((project, index) => (
                  <div key={index} className="rounded-md border p-3 space-y-2">
                    {editing ? (
                      <>
                        <Input
                          type="text"
                          aria-label="Project title"
                          placeholder="Project title"
                          value={project.title}
                          onChange={(event) => updateField('projects', parsedData.projects.map((item, projectIndex) =>
                            projectIndex === index ? { ...item, title: event.target.value } : item
                          ))}
                        />
                        <Textarea
                          aria-label="Project description"
                          placeholder="Project description"
                          value={project.description}
                          onChange={(event) => updateField('projects', parsedData.projects.map((item, projectIndex) =>
                            projectIndex === index ? { ...item, description: event.target.value } : item
                          ))}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => updateField('projects', parsedData.projects.filter((_, projectIndex) => projectIndex !== index))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{project.title || 'Untitled project'}</p>
                        <p className="text-sm text-muted-foreground">{project.description || '—'}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Work history</Label>
                  {editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateField('work_history', [
                        ...parsedData.work_history,
                        { role: '', company: '', duration: '' },
                      ])}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  )}
                </div>
                {parsedData.work_history.length === 0 && <p className="text-sm text-muted-foreground">No work history extracted.</p>}
                {parsedData.work_history.map((entry, index) => (
                  <div key={index} className="rounded-md border p-3 space-y-2">
                    {editing ? (
                      <>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Input type="text" aria-label="Job role" placeholder="Role" value={entry.role ?? ''} onChange={(event) => updateWorkHistory(index, 'role', event.target.value)} />
                          <Input type="text" aria-label="Company" placeholder="Company" value={entry.company ?? ''} onChange={(event) => updateWorkHistory(index, 'company', event.target.value)} />
                          <Input type="text" aria-label="Duration" placeholder="Duration" value={entry.duration ?? ''} onChange={(event) => updateWorkHistory(index, 'duration', event.target.value)} />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => updateField('work_history', parsedData.work_history.filter((_, entryIndex) => entryIndex !== index))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </>
                    ) : (
                      <div className="grid gap-1 sm:grid-cols-3">
                        <span className="font-medium">{entry.role || '—'}</span>
                        <span>{entry.company || '—'}</span>
                        <span className="text-muted-foreground">{entry.duration || '—'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {editing && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                  <Button onClick={() => void handleSave()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Keep Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Uploaded Resume</CardTitle>
              <CardDescription>Verify the extracted information against the original document.</CardDescription>
            </CardHeader>
            <CardContent>
              {parsedData.resume_url ? (
                <iframe
                  title="Uploaded candidate resume"
                  src={parsedData.resume_url}
                  className="h-[720px] w-full rounded-md border"
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-md border text-sm text-muted-foreground">
                  Resume preview is unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';
import { formatDate } from '@/utils/formatters';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

// Mock compliance data
const mockComplianceData = [
  {
    id: 1,
    title: 'Annual Tax Compliance',
    category: 'Tax',
    status: 'completed',
    dueDate: '2026-03-31',
    updated: '2026-01-15',
    assignee: 'HR Team',
    documents: 3,
    riskLevel: 'low'
  },
  {
    id: 2,
    title: 'Labor Law Audit',
    category: 'Legal',
    status: 'in_progress',
    dueDate: '2026-02-28',
    updated: '2026-01-20',
    assignee: 'Legal Dept',
    documents: 5,
    riskLevel: 'medium'
  },
  {
    id: 3,
    title: 'Health & Safety Certification',
    category: 'Safety',
    status: 'overdue',
    dueDate: '2026-01-15',
    updated: '2026-01-10',
    assignee: 'Safety Officer',
    documents: 8,
    riskLevel: 'high'
  },
  {
    id: 4,
    title: 'Data Privacy Compliance (GDPR)',
    category: 'Privacy',
    status: 'pending',
    dueDate: '2026-04-30',
    updated: '2026-01-05',
    assignee: 'Compliance Officer',
    documents: 12,
    riskLevel: 'medium'
  },
  {
    id: 5,
    title: 'Environmental Compliance Report',
    category: 'Environment',
    status: 'completed',
    dueDate: '2025-12-31',
    updated: '2025-12-28',
    assignee: 'Sustainability Team',
    documents: 4,
    riskLevel: 'low'
  },
  {
    id: 6,
    title: 'ISO 9001 Quality Certification',
    category: 'Quality',
    status: 'in_progress',
    dueDate: '2026-06-30',
    updated: '2026-01-22',
    assignee: 'Quality Manager',
    documents: 15,
    riskLevel: 'low'
  }
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
    case 'in_progress': return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
    case 'pending': return <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
    default: return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getRiskIcon = (riskLevel) => {
  switch (riskLevel) {
    case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'high': return <AlertCircle className="h-5 w-5 text-red-500" />;
    default: return null;
  }
};

const Compliance = () => {
  const [complianceItems, setComplianceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        setLoading(true);
        // Try API first, fallback to mock
        const response = await get('/hr/compliance');
        if (response && response.data) {
          setComplianceItems(response.data);
        } else {
          setComplianceItems(mockComplianceData);
        }
      } catch (error) {
        console.error('Failed to fetch compliance data:', error);
        setComplianceItems(mockComplianceData);
        toast({
          title: 'Using mock data',
          description: 'Compliance API not available, showing demo data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, [get, toast]);

  const handleDownload = (item) => {
    toast({
      title: `Download ${item.title}`,
      description: 'Document download initiated...',
    });
    // Mock download
    console.log('Downloading:', item.title);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compliance Management" 
        subtitle="Track regulatory compliance, audits, certifications, and legal requirements" 
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{complianceItems.length}</div>
            <p className="text-xs text-muted-foreground">Active compliance tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-6 w-6 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {complianceItems.filter(item => item.status === 'overdue').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceItems.reduce((sum, item) => sum + item.documents, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total attached files</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Compliance Checklist</CardTitle>
          <CardDescription>
            Monitor status, due dates, and required actions for all compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {getRiskIcon(item.riskLevel)}
                        {item.riskLevel?.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>{item.assignee}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDownload(item)}
                        className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Compliance;


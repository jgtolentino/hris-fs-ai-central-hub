'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  PieChart, 
  BarChart3, 
  MapPin, 
  Zap,
  Eye,
  Target,
  Handshake,
  TrendingDown,
  Clock,
  Globe,
  Smartphone
} from 'lucide-react';

interface ScoutMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalHandshakes: number;
  totalStores: number;
  totalRevenue: number;
  brandedPercentage: number;
  unbrandedPercentage: number;
  topPerformingBrand: string;
  regionCoverage: number;
  avgTransactionValue: number;
}

interface CampaignData {
  id: string;
  name: string;
  brand: string;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  handshakes: number;
  revenue: number;
  stores: number;
  region: string;
}

interface StoreData {
  id: string;
  name: string;
  location: string;
  region: string;
  handshakes: number;
  revenue: number;
  brandedRatio: number;
  lastTransaction: string;
}

export function ScoutDashboard() {
  const [metrics, setMetrics] = useState<ScoutMetrics>({
    totalCampaigns: 45,
    activeCampaigns: 12,
    totalHandshakes: 8456,
    totalStores: 234,
    totalRevenue: 2450000,
    brandedPercentage: 67.5,
    unbrandedPercentage: 32.5,
    topPerformingBrand: 'Coca-Cola',
    regionCoverage: 8,
    avgTransactionValue: 289.50
  });

  const [campaigns, setCampaigns] = useState<CampaignData[]>([
    {
      id: '1',
      name: 'Summer Refresh Campaign',
      brand: 'Coca-Cola',
      status: 'active',
      progress: 78,
      handshakes: 1234,
      revenue: 450000,
      stores: 89,
      region: 'NCR'
    },
    {
      id: '2',
      name: 'Instant Delight Push',
      brand: 'Lucky Me',
      status: 'active',
      progress: 45,
      handshakes: 892,
      revenue: 234000,
      stores: 67,
      region: 'Cebu'
    },
    {
      id: '3',
      name: 'Snack Attack Promo',
      brand: 'Jack n Jill',
      status: 'active',
      progress: 92,
      handshakes: 2134,
      revenue: 567000,
      stores: 156,
      region: 'Davao'
    }
  ]);

  const [stores, setStores] = useState<StoreData[]>([
    {
      id: '1',
      name: 'Aling Nena\'s Store',
      location: 'Quezon City',
      region: 'NCR',
      handshakes: 89,
      revenue: 23400,
      brandedRatio: 72.3,
      lastTransaction: '2 hours ago'
    },
    {
      id: '2',
      name: 'Kuya Ben\'s Sari-Sari',
      location: 'Makati',
      region: 'NCR',
      handshakes: 156,
      revenue: 45600,
      brandedRatio: 68.9,
      lastTransaction: '15 minutes ago'
    },
    {
      id: '3',
      name: 'Tita Rosa\'s Store',
      location: 'Cebu City',
      region: 'Cebu',
      handshakes: 234,
      revenue: 67800,
      brandedRatio: 81.2,
      lastTransaction: '1 hour ago'
    }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scout Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Philippine Retail Intelligence & Campaign Performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Live Data
            </Badge>
            <Button>
              <Target className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Handshakes</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(metrics.totalHandshakes)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Coverage</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatNumber(metrics.totalStores)}</div>
            <p className="text-xs text-muted-foreground">
              Across {metrics.regionCoverage} regions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="stores">Store Performance</TabsTrigger>
          <TabsTrigger value="analytics">Brand Analytics</TabsTrigger>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Active Campaigns
              </CardTitle>
              <CardDescription>
                Monitor real-time campaign performance across Philippine retail network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <span className="text-sm text-gray-500">• {campaign.brand}</span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {campaign.region}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{formatNumber(campaign.handshakes)}</div>
                        <div className="text-xs text-gray-500">Handshakes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{formatCurrency(campaign.revenue)}</div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{campaign.stores}</div>
                        <div className="text-xs text-gray-500">Stores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{campaign.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                    
                    <Progress value={campaign.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Store Performance
              </CardTitle>
              <CardDescription>
                Track individual store metrics and branded vs unbranded performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stores.map((store) => (
                  <div key={store.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{store.name}</h3>
                        <p className="text-sm text-gray-500">{store.location} • {store.region}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Last transaction</div>
                        <div className="text-sm font-medium">{store.lastTransaction}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{formatNumber(store.handshakes)}</div>
                        <div className="text-xs text-gray-500">Handshakes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{formatCurrency(store.revenue)}</div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{store.brandedRatio}%</div>
                        <div className="text-xs text-gray-500">Branded Ratio</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Branded Products</span>
                        <span>{store.brandedRatio}%</span>
                      </div>
                      <Progress value={store.brandedRatio} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Branded vs Unbranded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Branded Products</span>
                    <span className="text-sm font-bold text-blue-600">{metrics.brandedPercentage}%</span>
                  </div>
                  <Progress value={metrics.brandedPercentage} className="h-3" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Unbranded Products</span>
                    <span className="text-sm font-bold text-orange-600">{metrics.unbrandedPercentage}%</span>
                  </div>
                  <Progress value={metrics.unbrandedPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Performing Brand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{metrics.topPerformingBrand}</div>
                  <div className="text-sm text-gray-500 mb-4">Leading brand this month</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">2,456</div>
                      <div className="text-xs text-gray-500">Handshakes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">₱890K</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Market Insights
              </CardTitle>
              <CardDescription>
                AI-powered insights from Philippine retail data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-700">Regional Opportunity</h4>
                  <p className="text-sm text-gray-600">
                    Mindanao region shows 23% higher unbranded volume in cooking oil category. 
                    Potential partnership opportunity for major oil brands.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-700">Peak Performance</h4>
                  <p className="text-sm text-gray-600">
                    Weekend transactions show 34% higher branded product sales. 
                    Recommend increasing campaign activities on Saturdays.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-700">Category Trends</h4>
                  <p className="text-sm text-gray-600">
                    Snack category showing 15% growth month-over-month. 
                    Rice and staples remain 67% unbranded across all regions.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-700">Store Optimization</h4>
                  <p className="text-sm text-gray-600">
                    Stores with higher branded ratios (>70%) show 2.3x better revenue performance. 
                    Focus on brand education and incentives.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
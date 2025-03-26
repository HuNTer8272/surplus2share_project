"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageOpen, Calendar, MapPin, User } from "lucide-react";

export default function ReceiverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Set up axios interceptors for debugging
    const requestInterceptor = axios.interceptors.request.use((config) => {
      console.log('Dashboard API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
      });
      return config;
    }, (error) => {
      console.error('Request Error:', error);
      return Promise.reject(error);
    });

    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use((response) => {
      console.log('Dashboard API Response:', {
        status: response.status,
        data: response.data,
      });
      return response;
    }, (error) => {
      console.error('Response Error:', error.response || error);
      return Promise.reject(error);
    });

    const fetchUserAndAvailableDonations = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        console.log("Token available:", !!token);
        
        if (!token) {
          console.log("No token found, redirecting to login");
          router.push("/login");
          return;
        }

        // Parse user data from localStorage
        try {
          const userData = JSON.parse(localStorage.getItem("user"));
          console.log("User data:", userData ? { 
            id: userData.id, 
            name: userData.name, 
            role: userData.role 
          } : "No user data found");
          setUser(userData);
        } catch (err) {
          console.error("Error parsing user data:", err);
        }

        // Fetch available donations
        console.log("Fetching available donations from:", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/donations/all/available`);
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/donations/all/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          console.log("Available donations fetched successfully:", response.data.data.length);
          setAvailableDonations(response.data.data);
        } else {
          console.warn("API returned success: false", response.data);
          setError("Failed to load available donations. Server response indicated failure.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError("Failed to load available donations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndAvailableDonations();

    // Clean up interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [router]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Donations</h1>
        <p className="text-gray-600 mt-2">
          Welcome{user ? `, ${user.name}` : ""}! Browse available food donations here.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available donations...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      ) : availableDonations.length === 0 ? (
        <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
          <CardContent className="py-12">
            <div className="text-center">
              <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No donations available</h3>
              <p className="mt-2 text-gray-500">
                There are currently no food donations available for claiming.
              </p>
              <p className="mt-4 text-gray-500">
                Check back later for new donations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Donations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDonations.map((donation) => (
              <Card key={donation.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{donation.title}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">
                      AVAILABLE
                    </Badge>
                  </div>
                  <CardDescription>{donation.foodType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Donor: {donation.donor?.user?.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center">
                      <PackageOpen className="mr-2 h-4 w-4 text-gray-500" />
                      <span>
                        {donation.quantity} {donation.quantityUnit}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Pickup: {formatDate(donation.pickupDate)}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="flex-1">{donation.pickupAddress}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t">
                  <Link href={`/receiver/donations/${donation.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

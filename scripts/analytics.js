// Enhanced Analytics and Charts System
class Analytics {
    // Get registration trends with improved date handling
    static async getRegistrationTrends(days = 30) {
        try {
            console.log(`📊 Fetching registration trends for last ${days} days...`);
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const { data: members, error } = await window.supabase
                .from('members')
                .select('registration_date, church_name, inviter_name')
                .gte('registration_date', startDate.toISOString())
                .order('registration_date', { ascending: true });

            if (error) throw error;

            // Initialize dates for the entire period
            const trends = {};
            const dateLabels = [];
            
            // Pre-fill all dates in the range to ensure complete timeline
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                trends[dateStr] = 0;
                dateLabels.push(dateStr);
            }

            // Count registrations per date
            members.forEach(member => {
                if (member.registration_date) {
                    const date = member.registration_date.split('T')[0];
                    if (trends[date] !== undefined) {
                        trends[date]++;
                    }
                }
            });

            const data = dateLabels.map(date => trends[date] || 0);
            
            console.log(`📈 Found ${members.length} registrations in the period`);
            
            return {
                labels: dateLabels,
                data: data,
                total: members.length,
                average: (members.length / days).toFixed(1)
            };
        } catch (error) {
            console.error('❌ Error getting registration trends:', error);
            // Return empty data structure instead of throwing to prevent UI breakage
            return {
                labels: [],
                data: [],
                total: 0,
                average: 0
            };
        }
    }

    // Get church distribution with enhanced data
    static async getChurchDistribution() {
        try {
            console.log('🏛️ Fetching church distribution...');
            const members = await Database.getMembers();
            
            const distribution = {};
            let totalMembers = 0;
            
            members.forEach(member => {
                const church = member.church_name || 'Unknown Church';
                if (!distribution[church]) {
                    distribution[church] = 0;
                }
                distribution[church]++;
                totalMembers++;
            });

            // Sort by member count (descending)
            const sortedDistribution = Object.entries(distribution)
                .sort(([,a], [,b]) => b - a)
                .reduce((acc, [church, count]) => {
                    acc[church] = count;
                    return acc;
                }, {});

            const colors = [
                '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#7209b7',
                '#4895ef', '#560bad', '#b5179e', '#f8961e', '#38b000'
            ];

            return {
                labels: Object.keys(sortedDistribution),
                data: Object.values(sortedDistribution),
                colors: colors,
                total: totalMembers,
                churchCount: Object.keys(distribution).length
            };
        } catch (error) {
            console.error('❌ Error getting church distribution:', error);
            return {
                labels: [],
                data: [],
                colors: [],
                total: 0,
                churchCount: 0
            };
        }
    }

    // Get inviter performance with enhanced metrics
    static async getInviterPerformance(limit = 10) {
        try {
            console.log('🏆 Fetching inviter performance...');
            const members = await Database.getMembers();
            const inviters = await Database.getInviters();
            
            const performance = {};
            const today = new Date().toISOString().split('T')[0];
            
            // Calculate performance for each inviter
            inviters.forEach(inviter => {
                const inviterMembers = members.filter(member => 
                    member.inviter_name === inviter.full_name
                );
                
                const todayMembers = inviterMembers.filter(member => 
                    member.registration_date && 
                    member.registration_date.split('T')[0] === today
                );
                
                performance[inviter.full_name] = {
                    count: inviterMembers.length,
                    todayCount: todayMembers.length,
                    church: inviter.church_name || 'Unknown Church',
                    email: inviter.email,
                    registrationDate: inviter.registration_date
                };
            });

            // Sort by total count and limit results
            const sortedPerformance = Object.entries(performance)
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, limit)
                .reduce((acc, [name, data]) => {
                    acc[name] = data;
                    return acc;
                }, {});

            console.log(`🎯 Top ${Object.keys(sortedPerformance).length} inviters loaded`);
            
            return sortedPerformance;
        } catch (error) {
            console.error('❌ Error getting inviter performance:', error);
            return {};
        }
    }

    // Get daily statistics with enhanced metrics
    static async getDailyStats() {
        try {
            console.log('📅 Fetching daily statistics...');
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            const members = await Database.getMembers();
            const inviters = await Database.getInviters();
            
            const todayRegistrations = members.filter(member => 
                member.registration_date && 
                member.registration_date.split('T')[0] === today
            );
            
            const yesterdayRegistrations = members.filter(member => 
                member.registration_date && 
                member.registration_date.split('T')[0] === yesterdayStr
            );

            const totalMembers = members.length;
            const totalInviters = inviters.length;
            
            // Calculate growth metrics
            const growth = yesterdayRegistrations.length > 0 
                ? ((todayRegistrations.length - yesterdayRegistrations.length) / yesterdayRegistrations.length * 100).toFixed(1)
                : todayRegistrations.length > 0 ? 100 : 0;

            // Calculate average daily registration (last 7 days)
            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);
            const recentMembers = members.filter(member => 
                member.registration_date && 
                new Date(member.registration_date) >= last7Days
            );
            const averageDaily = (recentMembers.length / 7).toFixed(1);

            return {
                todayRegistrations: todayRegistrations.length,
                yesterdayRegistrations: yesterdayRegistrations.length,
                totalMembers,
                totalInviters,
                averageDaily: parseFloat(averageDaily),
                growth: parseFloat(growth),
                growthDirection: growth >= 0 ? 'up' : 'down'
            };
        } catch (error) {
            console.error('❌ Error getting daily stats:', error);
            return {
                todayRegistrations: 0,
                yesterdayRegistrations: 0,
                totalMembers: 0,
                totalInviters: 0,
                averageDaily: 0,
                growth: 0,
                growthDirection: 'neutral'
            };
        }
    }

    // NEW: Get hourly registration distribution for today
    static async getHourlyDistribution() {
        try {
            console.log('⏰ Fetching hourly distribution...');
            const today = new Date().toISOString().split('T')[0];
            
            const { data: members, error } = await window.supabase
                .from('members')
                .select('registration_date')
                .gte('registration_date', `${today}T00:00:00`)
                .lte('registration_date', `${today}T23:59:59`);

            if (error) throw error;

            // Initialize hours (0-23)
            const hourlyData = {};
            for (let i = 0; i < 24; i++) {
                hourlyData[i] = 0;
            }

            // Count registrations per hour
            members.forEach(member => {
                if (member.registration_date) {
                    const hour = new Date(member.registration_date).getHours();
                    hourlyData[hour]++;
                }
            });

            const labels = Object.keys(hourlyData).map(hour => 
                `${hour}:00`
            );
            const data = Object.values(hourlyData);

            return {
                labels,
                data,
                total: members.length,
                peakHour: Object.keys(hourlyData).reduce((a, b) => 
                    hourlyData[a] > hourlyData[b] ? a : b
                )
            };
        } catch (error) {
            console.error('❌ Error getting hourly distribution:', error);
            return {
                labels: [],
                data: [],
                total: 0,
                peakHour: 0
            };
        }
    }

    // NEW: Get registration sources (inviter performance by church)
    static async getRegistrationSources() {
        try {
            console.log('📋 Fetching registration sources...');
            const members = await Database.getMembers();
            const inviters = await Database.getInviters();
            
            const sources = {};
            
            // Group by church and then by inviter
            members.forEach(member => {
                const church = member.church_name || 'Unknown Church';
                const inviter = member.inviter_name || 'Direct Registration';
                
                if (!sources[church]) {
                    sources[church] = {};
                }
                
                if (!sources[church][inviter]) {
                    sources[church][inviter] = 0;
                }
                
                sources[church][inviter]++;
            });

            return sources;
        } catch (error) {
            console.error('❌ Error getting registration sources:', error);
            return {};
        }
    }

    // NEW: Get conversion rate (inviters with actual registrations)
    static async getConversionMetrics() {
        try {
            console.log('📊 Fetching conversion metrics...');
            const members = await Database.getMembers();
            const inviters = await Database.getInviters();
            
            const activeInviters = inviters.filter(inviter => {
                const hasRegistrations = members.some(member => 
                    member.inviter_name === inviter.full_name
                );
                return hasRegistrations;
            });

            const conversionRate = inviters.length > 0 
                ? ((activeInviters.length / inviters.length) * 100).toFixed(1)
                : 0;

            return {
                totalInviters: inviters.length,
                activeInviters: activeInviters.length,
                inactiveInviters: inviters.length - activeInviters.length,
                conversionRate: parseFloat(conversionRate),
                averagePerActive: activeInviters.length > 0 
                    ? (members.length / activeInviters.length).toFixed(1)
                    : 0
            };
        } catch (error) {
            console.error('❌ Error getting conversion metrics:', error);
            return {
                totalInviters: 0,
                activeInviters: 0,
                inactiveInviters: 0,
                conversionRate: 0,
                averagePerActive: 0
            };
        }
    }

    // NEW: Get comprehensive analytics dashboard data
    static async getDashboardAnalytics() {
        try {
            console.log('📈 Fetching comprehensive dashboard analytics...');
            
            const [
                trends,
                churchDistribution,
                inviterPerformance,
                dailyStats,
                conversionMetrics
            ] = await Promise.all([
                this.getRegistrationTrends(7), // Last 7 days
                this.getChurchDistribution(),
                this.getInviterPerformance(5), // Top 5 inviters
                this.getDailyStats(),
                this.getConversionMetrics()
            ]);

            return {
                trends,
                churchDistribution,
                inviterPerformance,
                dailyStats,
                conversionMetrics,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting dashboard analytics:', error);
            return {
                trends: { labels: [], data: [], total: 0, average: 0 },
                churchDistribution: { labels: [], data: [], colors: [], total: 0, churchCount: 0 },
                inviterPerformance: {},
                dailyStats: {
                    todayRegistrations: 0,
                    yesterdayRegistrations: 0,
                    totalMembers: 0,
                    totalInviters: 0,
                    averageDaily: 0,
                    growth: 0,
                    growthDirection: 'neutral'
                },
                conversionMetrics: {
                    totalInviters: 0,
                    activeInviters: 0,
                    inactiveInviters: 0,
                    conversionRate: 0,
                    averagePerActive: 0
                },
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Make Analytics class globally available
window.Analytics = Analytics;

console.log('✅ Enhanced Analytics system loaded successfully');
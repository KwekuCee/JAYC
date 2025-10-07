// Analytics and Charts System
class Analytics {
    // Get registration trends
    static async getRegistrationTrends(days = 30) {
        try {
            const { data: members, error } = await window.supabase
                .from('members')
                .select('registration_date, church_name')
                .gte('registration_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            // Group by date
            const trends = {};
            members.forEach(member => {
                const date = member.registration_date.split('T')[0];
                if (!trends[date]) {
                    trends[date] = 0;
                }
                trends[date]++;
            });

            return {
                labels: Object.keys(trends),
                data: Object.values(trends)
            };
        } catch (error) {
            console.error('Error getting registration trends:', error);
            throw error;
        }
    }

    // Get church distribution
    static async getChurchDistribution() {
        try {
            const members = await Database.getMembers();
            
            const distribution = {};
            members.forEach(member => {
                if (!distribution[member.church_name]) {
                    distribution[member.church_name] = 0;
                }
                distribution[member.church_name]++;
            });

            return {
                labels: Object.keys(distribution),
                data: Object.values(distribution),
                colors: ['#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#7209b7']
            };
        } catch (error) {
            console.error('Error getting church distribution:', error);
            throw error;
        }
    }

    // Get inviter performance
    static async getInviterPerformance() {
        try {
            const members = await Database.getMembers();
            const inviters = await Database.getInviters();
            
            const performance = {};
            inviters.forEach(inviter => {
                const memberCount = members.filter(member => member.inviter_name === inviter.full_name).length;
                performance[inviter.full_name] = {
                    count: memberCount,
                    church: inviter.church_name
                };
            });

            return performance;
        } catch (error) {
            console.error('Error getting inviter performance:', error);
            throw error;
        }
    }

    // Get daily statistics
    static async getDailyStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const members = await Database.getMembers();
            
            const todayRegistrations = members.filter(member => 
                member.registration_date.split('T')[0] === today
            ).length;

            const totalMembers = members.length;
            const totalInviters = (await Database.getInviters()).length;

            return {
                todayRegistrations,
                totalMembers,
                totalInviters,
                averageDaily: Math.round(totalMembers / 30) // Rough average
            };
        } catch (error) {
            console.error('Error getting daily stats:', error);
            throw error;
        }
    }
}

window.Analytics = Analytics;

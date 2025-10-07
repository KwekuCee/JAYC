// Enhanced Notifications Service
class Notifications {
    static emailConfig = {
        serviceId: 'service_ekvxkrl',
        templateId: 'template_k9mhapt',
        userId: '2BTr21gGjQQVLvgFR'
    };

    static init() {
        // Initialize EmailJS if available
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init(this.emailConfig.userId);
                console.log('✅ EmailJS initialized successfully');
                return true;
            } catch (error) {
                console.warn('⚠️ EmailJS initialization failed:', error);
                return false;
            }
        } else {
            console.warn('⚠️ EmailJS not loaded - notifications will be logged locally');
            return false;
        }
    }

    // Enhanced member welcome email
    static async sendMemberWelcome(memberData) {
        const notificationId = 'welcome_' + Date.now();
        
        try {
            console.log('📧 Attempting to send welcome email to:', memberData.email);
            
            // Basic validation
            if (!memberData.email || !memberData.full_name) {
                throw new Error('Missing required member data');
            }

            const templateParams = {
                to_email: memberData.email,
                to_name: memberData.full_name,
                church_name: memberData.church_name || 'JAYC',
                inviter_name: memberData.inviter_name || 'Church Inviter',
                registration_date: new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                program_name: 'Jesus Alive Youth Conference (JAYC)',
                year: new Date().getFullYear()
            };

            let emailSent = false;
            let emailResponse = null;

            // Try to send via EmailJS
            if (typeof emailjs !== 'undefined') {
                try {
                    emailResponse = await emailjs.send(
                        this.emailConfig.serviceId,
                        this.emailConfig.templateId,
                        templateParams
                    );
                    emailSent = true;
                    console.log('✅ Welcome email sent successfully to:', memberData.email);
                } catch (emailError) {
                    console.warn('⚠️ EmailJS failed, falling back to local logging:', emailError);
                    emailSent = false;
                }
            }

            // Log the notification
            this.logNotification({
                type: 'EMAIL',
                event: 'MEMBER_WELCOME',
                recipient: memberData.email,
                data: templateParams,
                success: emailSent,
                response: emailResponse,
                timestamp: new Date().toISOString(),
                id: notificationId
            });

            return emailSent;

        } catch (error) {
            console.error('❌ Error in sendMemberWelcome:', error);
            
            this.logNotification({
                type: 'EMAIL',
                event: 'MEMBER_WELCOME',
                recipient: memberData.email,
                data: memberData,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                id: notificationId
            });

            return false;
        }
    }

    // Enhanced inviter notification
    static async sendInviterNotification(inviterEmail, memberData) {
        const notificationId = 'inviter_' + Date.now();
        
        try {
            console.log('📧 Sending inviter notification to:', inviterEmail);

            const templateParams = {
                to_email: inviterEmail,
                inviter_name: memberData.inviter_name,
                member_name: memberData.full_name,
                member_email: memberData.email || 'Not provided',
                member_phone: memberData.phone || 'Not provided',
                member_church: memberData.church_name,
                registration_date: new Date().toLocaleDateString(),
                total_members: '1' // You could calculate this from database
            };

            let emailSent = false;
            let emailResponse = null;

            // Use the same template or create a new one for inviters
            if (typeof emailjs !== 'undefined') {
                try {
                    emailResponse = await emailjs.send(
                        this.emailConfig.serviceId,
                        this.emailConfig.templateId, // Use same template or create new one
                        templateParams
                    );
                    emailSent = true;
                    console.log('✅ Inviter notification sent to:', inviterEmail);
                } catch (emailError) {
                    console.warn('⚠️ Inviter email failed:', emailError);
                    emailSent = false;
                }
            }

            this.logNotification({
                type: 'EMAIL',
                event: 'INVITER_NOTIFICATION',
                recipient: inviterEmail,
                data: templateParams,
                success: emailSent,
                response: emailResponse,
                timestamp: new Date().toISOString(),
                id: notificationId
            });

            return emailSent;

        } catch (error) {
            console.error('❌ Error sending inviter notification:', error);
            
            this.logNotification({
                type: 'EMAIL',
                event: 'INVITER_NOTIFICATION',
                recipient: inviterEmail,
                data: { inviterEmail, memberData },
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                id: notificationId
            });

            return false;
        }
    }

    // Enhanced logging system
    static logNotification(notification) {
        try {
            const logs = JSON.parse(localStorage.getItem('jayc_notification_logs') || '[]');
            
            // Add the notification
            logs.unshift(notification);
            
            // Keep only last 200 logs to prevent storage issues
            if (logs.length > 200) {
                logs.splice(200);
            }
            
            localStorage.setItem('jayc_notification_logs', JSON.stringify(logs));
            
            // Console output based on success
            const icon = notification.success ? '✅' : '❌';
            console.log(`${icon} ${notification.type} ${notification.event} - ${notification.recipient}`);
            
        } catch (error) {
            console.error('❌ Failed to log notification:', error);
        }
    }

    // Get notifications for admin panel
    static getNotifications(limit = 50, type = 'all') {
        try {
            let logs = JSON.parse(localStorage.getItem('jayc_notification_logs') || '[]');
            
            if (type !== 'all') {
                logs = logs.filter(log => log.type === type);
            }
            
            return logs.slice(0, limit);
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    // Get notification statistics
    static getStats() {
        try {
            const logs = JSON.parse(localStorage.getItem('jayc_notification_logs') || '[]');
            
            return {
                total: logs.length,
                successful: logs.filter(log => log.success).length,
                failed: logs.filter(log => !log.success).length,
                emails: logs.filter(log => log.type === 'EMAIL').length,
                sms: logs.filter(log => log.type === 'SMS').length
            };
        } catch (error) {
            return { total: 0, successful: 0, failed: 0, emails: 0, sms: 0 };
        }
    }

    // Clear notifications
    static clearLogs() {
        localStorage.removeItem('jayc_notification_logs');
        console.log('📧 Notification logs cleared');
    }
}

// Initialize when script loads
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            Notifications.init();
        }, 1000);
    });
}

// Make available globally
window.Notifications = Notifications;

console.log('✅ Notifications system loaded');

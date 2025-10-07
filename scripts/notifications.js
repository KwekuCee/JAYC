// Enhanced Notifications Service with better email handling
class Notifications {
    static emailConfig = {
        serviceId: 'service_ekvxkrl',
        templateId: 'template_k9mhapt',
        userId: '2BTr21gGjQQVLvgFR'
    };

    // Email validation function
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    static init() {
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init(this.emailConfig.userId);
                console.log('✅ EmailJS initialized successfully');
                return true;
            } catch (error) {
                console.warn('⚠️ EmailJS initialization failed:', error);
                return false;
            }
        }
        return false;
    }

    // Enhanced member welcome email with better error handling
    static async sendMemberWelcome(memberData) {
        const notificationId = 'welcome_' + Date.now();
        
        try {
            console.log('📧 Attempting to send welcome email to:', memberData.email);

            // Validate email
            if (!this.isValidEmail(memberData.email)) {
                console.warn('⚠️ Invalid email address:', memberData.email);
                this.logNotification({
                    type: 'EMAIL',
                    event: 'MEMBER_WELCOME',
                    recipient: memberData.email,
                    data: memberData,
                    success: false,
                    error: 'Invalid email address',
                    timestamp: new Date().toISOString(),
                    id: notificationId
                });
                return false;
            }

            const templateParams = {
                to_email: memberData.email.trim(),
                to_name: memberData.full_name || 'Member',
                church_name: memberData.church_name || 'JAYC',
                inviter_name: memberData.inviter_name || 'Church Inviter',
                registration_date: new Date().toLocaleDateString(),
                program_name: 'Jesus Alive Youth Conference (JAYC)'
            };

            // Double-check required fields for EmailJS
            if (!templateParams.to_email) {
                throw new Error('Recipient email is empty');
            }

            let emailSent = false;
            let emailResponse = null;

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
                    console.warn('⚠️ EmailJS failed:', emailError);
                    // Log the specific error for debugging
                    if (emailError.text) {
                        console.warn('EmailJS error details:', emailError.text);
                    }
                    emailSent = false;
                }
            }

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

    // Enhanced inviter notification with email validation
    static async sendInviterNotification(inviterEmail, memberData) {
        const notificationId = 'inviter_' + Date.now();
        
        try {
            console.log('📧 Sending inviter notification to:', inviterEmail);

            // Validate inviter email
            if (!this.isValidEmail(inviterEmail)) {
                console.warn('⚠️ Invalid inviter email address:', inviterEmail);
                this.logNotification({
                    type: 'EMAIL',
                    event: 'INVITER_NOTIFICATION',
                    recipient: inviterEmail,
                    data: { inviterEmail, memberData },
                    success: false,
                    error: 'Invalid inviter email address',
                    timestamp: new Date().toISOString(),
                    id: notificationId
                });
                return false;
            }

            const templateParams = {
                to_email: inviterEmail.trim(),
                inviter_name: memberData.inviter_name,
                member_name: memberData.full_name,
                member_email: memberData.email || 'Not provided',
                member_phone: memberData.phone || 'Not provided',
                member_church: memberData.church_name,
                registration_date: new Date().toLocaleDateString()
            };

            // Double-check required fields
            if (!templateParams.to_email) {
                throw new Error('Recipient email is empty');
            }

            let emailSent = false;
            let emailResponse = null;

            if (typeof emailjs !== 'undefined') {
                try {
                    // Use the same template for now, or create a specific one
                    emailResponse = await emailjs.send(
                        this.emailConfig.serviceId,
                        this.emailConfig.templateId,
                        templateParams
                    );
                    emailSent = true;
                    console.log('✅ Inviter notification sent to:', inviterEmail);
                } catch (emailError) {
                    console.warn('⚠️ Inviter email failed:', emailError);
                    if (emailError.text) {
                        console.warn('EmailJS error details:', emailError.text);
                    }
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

    // Rest of your methods remain the same...
    static logNotification(notification) {
        try {
            const logs = JSON.parse(localStorage.getItem('jayc_notification_logs') || '[]');
            logs.unshift(notification);
            if (logs.length > 200) logs.splice(200);
            localStorage.setItem('jayc_notification_logs', JSON.stringify(logs));
            
            const icon = notification.success ? '✅' : '❌';
            console.log(`${icon} ${notification.type} ${notification.event} - ${notification.recipient}`);
        } catch (error) {
            console.error('❌ Failed to log notification:', error);
        }
    }

    static getNotifications(limit = 50, type = 'all') {
        try {
            let logs = JSON.parse(localStorage.getItem('jayc_notification_logs') || '[]');
            if (type !== 'all') logs = logs.filter(log => log.type === type);
            return logs.slice(0, limit);
        } catch (error) {
            return [];
        }
    }

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

    static clearLogs() {
        localStorage.removeItem('jayc_notification_logs');
        console.log('📧 Notification logs cleared');
    }
}

// Initialize
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => Notifications.init(), 1000);
    });
}

window.Notifications = Notifications;
console.log('✅ Enhanced Notifications system loaded');

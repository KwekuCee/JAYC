// Enhanced Notifications Service with separate templates
class Notifications {
    static emailConfig = {
        serviceId: 'service_ekvxkrl',
        templateId: 'template_k9mhapt', // Welcome template
        inviterTemplateId: 'template_82vfdzo', // Replace with actual inviter template ID
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
                console.log('📧 Templates: Welcome =', this.emailConfig.templateId, 'Inviter =', this.emailConfig.inviterTemplateId);
                return true;
            } catch (error) {
                console.warn('⚠️ EmailJS initialization failed:', error);
                return false;
            }
        }
        return false;
    }

    // Send welcome email to NEW MEMBER
    static async sendMemberWelcome(memberData) {
        const notificationId = 'welcome_' + Date.now();
        
        try {
            console.log('📧 Sending WELCOME email to new member:', memberData.email);

            // Validate member email
            if (!this.isValidEmail(memberData.email)) {
                console.warn('⚠️ Invalid member email address:', memberData.email);
                this.logNotification({
                    type: 'EMAIL',
                    event: 'MEMBER_WELCOME',
                    recipient: memberData.email,
                    data: memberData,
                    success: false,
                    error: 'Invalid member email address',
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
                program_name: 'Jesus Alive Youth Conference (JAYC)',
                year: new Date().getFullYear()
            };

            console.log('📧 Welcome template params:', templateParams);

            let emailSent = false;
            let emailResponse = null;

            if (typeof emailjs !== 'undefined') {
                try {
                    // Use WELCOME template for new member
                    emailResponse = await emailjs.send(
                        this.emailConfig.serviceId,
                        this.emailConfig.templateId, // Welcome template
                        templateParams
                    );
                    emailSent = true;
                    console.log('✅ Welcome email sent successfully to new member:', memberData.email);
                } catch (emailError) {
                    console.warn('⚠️ Welcome email failed:', emailError);
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

    // Send notification to INVITER about new member
    static async sendInviterNotification(inviterEmail, memberData) {
        const notificationId = 'inviter_' + Date.now();
        
        try {
            console.log('📧 Sending INVITER notification to:', inviterEmail);

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
                registration_date: new Date().toLocaleDateString(),
                total_members: '1', // You could calculate actual count from database
                program_name: 'Jesus Alive Youth Conference (JAYC)'
            };

            console.log('📧 Inviter template params:', templateParams);

            let emailSent = false;
            let emailResponse = null;

            if (typeof emailjs !== 'undefined') {
                try {
                    // Use INVITER template for inviter notification
                    emailResponse = await emailjs.send(
                        this.emailConfig.serviceId,
                        this.emailConfig.inviterTemplateId, // Inviter template
                        templateParams
                    );
                    emailSent = true;
                    console.log('✅ Inviter notification sent successfully to:', inviterEmail);
                } catch (emailError) {
                    console.warn('⚠️ Inviter notification failed:', emailError);
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

    // Log notification
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
console.log('✅ Dual-template Notifications system loaded');

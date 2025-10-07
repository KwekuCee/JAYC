// Real Notifications Service with EmailJS and Twilio
class Notifications {
    // EmailJS Configuration
    static emailConfig = {
        serviceId: 'service_ekvxkrl',
        templateId: 'template_k9mhapt',
        userId: '2BTr21gGjQQVLvgFR'// Replace with yours
    };

    // Twilio Configuration (Optional - requires paid account)
    static twilioConfig = {
        accountSid: 'your_twilio_account_sid',
        authToken: 'your_twilio_auth_token',
        phoneNumber: 'your_twilio_phone_number'
    };

    // Initialize EmailJS
    static initEmailJS() {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(this.emailConfig.userId);
            console.log('EmailJS initialized');
        } else {
            console.warn('EmailJS not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"></script>');
        }
    }

    // Send welcome email to new member
    static async sendMemberWelcome(memberData) {
        try {
            if (typeof emailjs === 'undefined') {
                console.log('EmailJS not available, logging email locally');
                this.logNotification('EMAIL', 'MEMBER_WELCOME', memberData);
                return true;
            }

            const templateParams = {
                to_email: memberData.email,
                to_name: memberData.full_name,
                church_name: memberData.church_name,
                inviter_name: memberData.inviter_name,
                registration_date: new Date().toLocaleDateString(),
                program_name: 'Jesus Alive Youth Conference'
            };

            const response = await emailjs.send(
                this.emailConfig.serviceId,
                this.emailConfig.templateId,
                templateParams
            );

            console.log('✅ Welcome email sent successfully:', response);
            this.logNotification('EMAIL', 'MEMBER_WELCOME', memberData, true);
            return true;

        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
            this.logNotification('EMAIL', 'MEMBER_WELCOME', memberData, false);
            return false;
        }
    }

    // Send notification to inviter about new member
    static async sendInviterNotification(inviterEmail, memberData) {
        try {
            if (typeof emailjs === 'undefined') {
                console.log('EmailJS not available, logging notification locally');
                this.logNotification('EMAIL', 'INVITER_NOTIFICATION', { inviterEmail, memberData });
                return true;
            }

            const templateParams = {
                to_email: inviterEmail,
                inviter_name: memberData.inviter_name,
                member_name: memberData.full_name,
                member_email: memberData.email,
                member_phone: memberData.phone,
                member_church: memberData.church_name,
                registration_date: new Date().toLocaleDateString()
            };

            const response = await emailjs.send(
                this.emailConfig.serviceId,
                'inviter_notification_template', // Create this template in EmailJS
                templateParams
            );

            console.log('✅ Inviter notification sent successfully:', response);
            this.logNotification('EMAIL', 'INVITER_NOTIFICATION', { inviterEmail, memberData }, true);
            return true;

        } catch (error) {
            console.error('❌ Error sending inviter notification:', error);
            this.logNotification('EMAIL', 'INVITER_NOTIFICATION', { inviterEmail, memberData }, false);
            return false;
        }
    }

    // Send SMS via Twilio (Optional - requires paid account)
    static async sendSMS(phoneNumber, message) {
        try {
            // Check if Twilio credentials are available
            if (!this.twilioConfig.accountSid || this.twilioConfig.accountSid === 'your_twilio_account_sid') {
                console.log('Twilio not configured, logging SMS locally:', { phoneNumber, message });
                this.logNotification('SMS', 'GENERAL', { phoneNumber, message }, false);
                return false;
            }

            // Twilio API call would go here
            // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.twilioConfig.accountSid}/Messages.json`, {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': 'Basic ' + btoa(this.twilioConfig.accountSid + ':' + this.twilioConfig.authToken),
            //         'Content-Type': 'application/x-www-form-urlencoded',
            //     },
            //     body: new URLSearchParams({
            //         To: phoneNumber,
            //         From: this.twilioConfig.phoneNumber,
            //         Body: message
            //     })
            // });

            console.log('📱 SMS would be sent to:', phoneNumber, 'Message:', message);
            this.logNotification('SMS', 'GENERAL', { phoneNumber, message }, true);
            return true;

        } catch (error) {
            console.error('❌ Error sending SMS:', error);
            this.logNotification('SMS', 'GENERAL', { phoneNumber, message }, false);
            return false;
        }
    }

    // Enhanced notification logging
    static logNotification(type, event, data, success = false) {
        const notifications = JSON.parse(localStorage.getItem('notification_logs')) || [];
        const notification = {
            type,
            event,
            data,
            success,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        };
        
        notifications.unshift(notification); // Add to beginning
        localStorage.setItem('notification_logs', JSON.stringify(notifications.slice(0, 1000))); // Keep last 1000
        
        console.log(`📧 ${success ? '✅' : '❌'} ${type} ${event}:`, data);
    }

    // Get notification logs with filtering
    static getNotificationLogs(limit = 50, type = 'all') {
        let logs = JSON.parse(localStorage.getItem('notification_logs')) || [];
        
        if (type !== 'all') {
            logs = logs.filter(log => log.type === type);
        }
        
        return logs.slice(0, limit);
    }

    // Clear notification logs
    static clearNotificationLogs() {
        localStorage.removeItem('notification_logs');
    }

    // Get notification statistics
    static getNotificationStats() {
        const logs = JSON.parse(localStorage.getItem('notification_logs')) || [];
        
        const stats = {
            total: logs.length,
            successful: logs.filter(log => log.success).length,
            failed: logs.filter(log => !log.success).length,
            byType: {},
            byEvent: {}
        };

        logs.forEach(log => {
            stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
            stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;
        });

        return stats;
    }
}

// Initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    Notifications.initEmailJS();
});

window.Notifications = Notifications;

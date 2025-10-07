// Notifications Service
class Notifications {
    // Email service configuration (using EmailJS or similar)
    static emailService = {
        serviceId: 'your_email_service_id',
        templateId: 'your_template_id',
        userId: 'your_user_id'
    };

    // SMS service configuration (using Twilio or similar)
    static smsService = {
        accountSid: 'your_twilio_sid',
        authToken: 'your_twilio_token',
        phoneNumber: 'your_twilio_number'
    };

    // Send welcome email to new member
    static async sendMemberWelcome(memberData) {
        try {
            const emailData = {
                to_email: memberData.email,
                to_name: memberData.full_name,
                church_name: memberData.church_name,
                inviter_name: memberData.inviter_name,
                registration_date: new Date().toLocaleDateString()
            };

            console.log('Sending welcome email to:', memberData.email);
            
            // For now, log the email (integrate with actual email service later)
            this.logNotification('EMAIL', 'MEMBER_WELCOME', memberData);
            
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return false;
        }
    }

    // Send notification to inviter about new member
    static async sendInviterNotification(inviterEmail, memberData) {
        try {
            console.log('Notifying inviter:', inviterEmail, 'about new member:', memberData.full_name);
            
            // For now, log the notification (integrate with actual service later)
            this.logNotification('SMS/EMAIL', 'INVITER_NOTIFICATION', {
                inviter_email: inviterEmail,
                member_name: memberData.full_name,
                member_church: memberData.church_name
            });
            
            return true;
        } catch (error) {
            console.error('Error sending inviter notification:', error);
            return false;
        }
    }

    // Send SMS notification
    static async sendSMS(phoneNumber, message) {
        try {
            console.log('Sending SMS to:', phoneNumber, 'Message:', message);
            
            // For now, log the SMS (integrate with Twilio later)
            this.logNotification('SMS', 'GENERAL', { phone: phoneNumber, message });
            
            return true;
        } catch (error) {
            console.error('Error sending SMS:', error);
            return false;
        }
    }

    // Log notifications for tracking
    static logNotification(type, event, data) {
        const notifications = JSON.parse(localStorage.getItem('notification_logs')) || [];
        notifications.push({
            type,
            event,
            data,
            timestamp: new Date().toISOString(),
            sent: false // Mark as false for now since we're just logging
        });
        localStorage.setItem('notification_logs', JSON.stringify(notifications));
        
        console.log(`📧 ${type} Notification Logged:`, { event, data });
    }

    // Get notification logs (for admin)
    static getNotificationLogs() {
        return JSON.parse(localStorage.getItem('notification_logs')) || [];
    }
}

// Make globally available
window.Notifications = Notifications;

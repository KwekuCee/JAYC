// Enhanced Notifications Service with separate templates
class Notifications {
    static emailConfig = {
        serviceId: 'service_ekvxkrl',
        templateId: 'template_k9mhapt', // Welcome template
        inviterTemplateId: 'template_82vfdzo', // Inviter template
        userId: '2BTr21gGjQQVLvgFR'
    };

    // Email validation function
    static isValidEmail(email) {
        if (!email || typeof email !== 'string' || email.trim() === '') return false;
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
            // Check if member has email - if not, skip gracefully
            if (!memberData.email || !this.isValidEmail(memberData.email)) {
                console.log('📧 No valid email provided, skipping welcome email');
                this.logNotification({
                    type: 'EMAIL',
                    event: 'MEMBER_WELCOME',
                    recipient: 'No email provided',
                    data: memberData,
                    success: true, // Mark as success since it's intentional
                    note: 'No email provided - skipped sending',
                    timestamp: new Date().toISOString(),
                    id: notificationId
                });
                return true; // Return true since it's not an error
            }

            console.log('📧 Sending WELCOME email to new member:', memberData.email);

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
                recipient: memberData.email || 'No email provided',
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

            // Validate inviter email - if invalid, skip gracefully
            if (!this.isValidEmail(inviterEmail)) {
                console.warn('⚠️ Invalid inviter email address, skipping inviter notification:', inviterEmail);
                this.logNotification({
                    type: 'EMAIL',
                    event: 'INVITER_NOTIFICATION',
                    recipient: inviterEmail || 'No email provided',
                    data: { inviterEmail, memberData },
                    success: true, // Mark as success since it's intentional
                    note: 'Invalid inviter email - skipped sending',
                    timestamp: new Date().toISOString(),
                    id: notificationId
                });
                return true; // Return true since it's not an error
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
                recipient: inviterEmail || 'No email provided',
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
            const note = notification.note ? ` (${notification.note})` : '';
            console.log(`${icon} ${notification.type} ${notification.event} - ${notification.recipient}${note}`);
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
            
            // Separate actual attempts from intentional skips
            const actualAttempts = logs.filter(log => !log.note || !log.note.includes('skipped'));
            const intentionalSkips = logs.filter(log => log.note && log.note.includes('skipped'));
            
            return {
                total: logs.length,
                attempted: actualAttempts.length,
                skipped: intentionalSkips.length,
                successful: actualAttempts.filter(log => log.success).length,
                failed: actualAttempts.filter(log => !log.success).length,
                emails: logs.filter(log => log.type === 'EMAIL').length,
                sms: logs.filter(log => log.type === 'SMS').length
            };
        } catch (error) {
            return { 
                total: 0, 
                attempted: 0, 
                skipped: 0, 
                successful: 0, 
                failed: 0, 
                emails: 0, 
                sms: 0 
            };
        }
    }

    // Add to Notifications class in notifications.js
static async sendActiveInviterCongratulations(inviterEmail, inviterName, achievement) {
    const notificationId = 'congrats_' + Date.now();
    
    try {
        console.log('🎉 Sending congratulations to active inviter:', inviterEmail);

        if (!this.isValidEmail(inviterEmail)) {
            console.warn('Invalid email for congratulations:', inviterEmail);
            return false;
        }

        const templateParams = {
            to_email: inviterEmail.trim(),
            to_name: inviterName,
            achievement: achievement,
            congratulation_date: new Date().toLocaleDateString(),
            program_name: 'Jesus Alive Youth Conference (JAYC)'
        };

        let emailSent = false;
        let emailResponse = null;

        if (typeof emailjs !== 'undefined') {
            try {
                // You'll need to create this template in EmailJS
                emailResponse = await emailjs.send(
                    this.emailConfig.serviceId,
                    'active_inviter_template', // Create this template
                    templateParams
                );
                emailSent = true;
                console.log('✅ Congratulations email sent to:', inviterEmail);
            } catch (emailError) {
                console.warn('⚠️ Congratulations email failed:', emailError);
                emailSent = false;
            }
        }

        this.logNotification({
            type: 'EMAIL',
            event: 'ACTIVE_INVITER_CONGRATS',
            recipient: inviterEmail,
            data: templateParams,
            success: emailSent,
            response: emailResponse,
            timestamp: new Date().toISOString(),
            id: notificationId
        });

        return emailSent;

    } catch (error) {
        console.error('❌ Error sending congratulations:', error);
        return false;
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
console.log('✅ Enhanced Notifications system loaded (email optional)');

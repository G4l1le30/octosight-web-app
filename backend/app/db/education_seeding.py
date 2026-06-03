import os
from sqlalchemy.orm import Session
from app.models.education import EducationModule, EducationArticle

# ── Media ──────────────────────────────────────────────────────────

MODULE_IMAGES = {
    1: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop",
    2: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
    3: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop",
    4: "https://images.unsplash.com/photo-1553729459-afe8f7e50e0b?w=800&h=400&fit=crop",
    5: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=400&fit=crop",
    6: "https://images.unsplash.com/photo-1551808525-51a94da548ce?w=800&h=400&fit=crop",
    7: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop",
    8: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
}

ARTICLE_IMAGES_ORDERED = [
    # Module 1 (Phishing Basics) — 3 articles
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553729459-afe8f7e50e0b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
    # Module 2 (Phishing Prevention) — 1 article
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop",
    # Module 3 (Social Engineering) — 1 article
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop",
    # Module 4 (Spear Phishing & Whaling) — 1 article
    "https://images.unsplash.com/photo-1510915228340-64c85a01a161?w=400&h=300&fit=crop",
    # Module 5 (Advanced Threats) — 1 article
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=300&fit=crop",
    # Module 6 (Ransomware) — 1 article
    "https://images.unsplash.com/photo-1551808525-51a94da548ce?w=400&h=300&fit=crop",
    # Module 7 (Incident Response) — 1 article
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
    # Module 8 (Advanced Detection & CTI) — 1 article
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop",
]

ARTICLE_IMAGES = iter(ARTICLE_IMAGES_ORDERED)

# ── Data ───────────────────────────────────────────────────────────

EDUCATION_MODULES_DATA = [
    # ──────────────────── Module 1 ────────────────────
    {
        "title": "Phishing Basics — Understanding Basic Threats",
        "level": "BASIC",
        "order_index": 1,
        "description": "Learn the definition of phishing, how it works, and the basic characteristics of phishing emails. This module provides the foundation for understanding the most common digital security threats.",
        "duration_mins": 30,
        "articles": [
            {
                "title": "How to Detect Phishing Emails: A Comprehensive Guide",
                "url": "https://medium.com/@how-to-identify-phishing-email/how-to-detect-phishing-emails-a-comprehensive-guide-694df7d1794f",
                "author": "Phil Rawlins",
                "duration_mins": 4,
                "publication_date": "2024-02-02",
                "description": "A comprehensive guide to identifying phishing emails focusing on scrutinizing sender addresses, grammatical errors, and unexpected attachments.",
                "content": [
                    {"heading": "What is a Phishing Email?", "body": "A phishing email is a fake message that looks like it comes from a real company such as a bank, an online store, or a social media platform. Scammers send these emails to trick you into giving them your personal information like passwords or bank details. These attacks are one of the most common types of cyber threats today and they continue to grow more sophisticated every year as scammers develop new techniques to bypass security filters and fool their victims."},
                    {"heading": "Why Should You Care About Phishing?", "body": "Phishing attacks can lead to identity theft, financial loss, and unauthorized access to your personal accounts. In 2024 alone millions of people worldwide fell victim to phishing scams losing billions of dollars to these schemes. The damage is not just financial because victims also suffer from stress, reputational harm, and the time-consuming process of recovering their accounts and restoring their digital identities."},
                    {"heading": "How Phishing Works", "body": "A typical phishing attack starts when a scammer sends a fake email to a large number of people hoping that at least a few will take the bait. The email looks like it comes from a trusted company such as a bank, an online store, or a social media platform. The message usually asks you to click a link, download an attachment, or reply with personal information like your username and password. If you take the bait the scammer can steal your data or infect your device with malware that can spy on everything you do."},
                    {"heading": "Common Signs of a Phishing Email", "body": "Check the sender address carefully because scammers often use addresses that look real but have small differences. For example instead of support@yourbank.com they might use support@yourbank-security.com or support@yourb4nk.com with a number replacing a letter. Look for spelling and grammar mistakes because real companies check their emails carefully before sending them. If you see typos, strange wording, or bad grammar it is a strong sign that something is wrong. Watch out for urgent messages because phishing emails often try to scare you into acting quickly. They might say things like your account will be closed in 24 hours or unauthorized login detected act now. Real companies rarely use this kind of aggressive language to communicate with their customers."},
                    {"heading": "What To Do If You Suspect a Phishing Email", "body": "First do not click any links in the email no matter how tempting or urgent the message seems. Second do not download any attachments because they could contain malware that infects your computer. Third report the email to your bank fraud department so they can investigate and take action to protect other customers. Fourth delete the email from your inbox to avoid accidentally opening it later. If you are unsure about an email contact the company directly using a phone number or website that you know is real and have used before."},
                    {"heading": "Key Takeaway", "body": "Always slow down and check before you click on anything. If something feels wrong trust your gut and verify with the company directly using a phone number or website you know is real. Scammers rely on you acting quickly without thinking so taking even a few extra seconds to examine a suspicious message can save you from becoming a victim of fraud."}
                ]
            },
            {
                "title": "Phishing Prevention — Learn How to Defend Against Phishing",
                "url": "https://medium.com/@demegorash/phishing-prevention-89579a326d7b",
                "author": "Demegorash",
                "duration_mins": 8,
                "publication_date": "2025-11-15",
                "description": "Learn about various security measures organizations can implement to prevent, detect, and mitigate phishing threats.",
                "content": [
                    {"heading": "How to Protect Yourself From Phishing", "body": "Preventing phishing starts with building good habits that become part of your daily routine. By following a few simple but consistent rules you can avoid most phishing attempts and keep your personal information safe. Think of these habits as your personal security routine just like locking your front door every night before going to sleep. The more consistently you practice them the more naturally they will come to you when you encounter a suspicious message or request."},
                    {"heading": "Use Strong and Unique Passwords", "body": "Create passwords that are long and hard for others to guess by using a mix of uppercase letters, lowercase letters, numbers, and special characters. Avoid using obvious choices like your name, birthday, or common words that someone could find out about you through social media. Never use the same password for different accounts because if one account gets compromised all your other accounts become vulnerable too. Consider using a password manager application that can generate strong random passwords for each of your accounts and store them securely so you only need to remember one master password."},
                    {"heading": "Turn On Two-Factor Authentication (2FA)", "body": "Two-factor authentication adds an extra layer of security to your accounts beyond just a password. Even if a scammer manages to steal or guess your password they cannot log in without the second step which is usually a temporary code sent to your phone or generated by an authenticator app. Always enable 2FA whenever it is available because it is one of the most effective ways to protect your accounts from unauthorized access. Many banks, email providers, and social media platforms offer this feature and setting it up takes only a few minutes."},
                    {"heading": "Keep Your Software and Devices Updated", "body": "Always install updates for your phone, computer, and applications as soon as they become available. These updates often contain important security fixes that patch holes and vulnerabilities that scammers might use to attack you. Set your devices to update automatically so you never miss an important security patch even when you are busy or forget to check manually."},
                    {"heading": "Know What Real Companies Look Like", "body": "Banks and official companies will never ask for your password, PIN, or OTP through email, text message, or phone call. If someone asks for this information it is definitely a scam regardless of how official they sound. Learn the communication patterns of the services you use so you can spot fakes more easily. For example your bank might send you transaction alerts but they will never include a link asking you to log in and confirm details."},
                    {"heading": "When In Doubt, Always Verify", "body": "If you receive a suspicious message that claims to be from a company or organization you trust do not reply or click any links. Instead call the company directly using the phone number listed on their official website not the number provided in the suspicious message. A few minutes spent verifying a request can save you from hours or even days of dealing with the consequences of fraud and identity theft."}
                ]
            },
            {
                "title": "Phishing Email — Ultimate Resources for Beginners",
                "url": "https://hassen-hannachi.medium.com/phishing-email-ultimate-resources-60bba3e99fde",
                "author": "Hassen Hannachi",
                "duration_mins": 5,
                "publication_date": "2024-04-28",
                "description": "A compilation of tools and resources for analyzing phishing emails.",
                "content": [
                    {"heading": "Helpful Tools to Spot Phishing", "body": "You do not need to be a computer expert or a cybersecurity professional to check if an email is fake. There are many free tools and resources available online that can help you analyze suspicious messages and protect yourself from scams. Learning to use even just one or two of these tools can significantly reduce your chances of falling victim to phishing attacks."},
                    {"heading": "Check Links Before You Click", "body": "Before clicking any link in an email take a moment to inspect it first. On a computer hover your mouse cursor over the link without clicking and look at the bottom corner of your screen where the real web address will appear. If the address looks strange uses misspellings or does not match the company name do not click. On mobile phones press and hold the link with your finger until a preview pops up showing the actual URL before you decide to open it."},
                    {"heading": "Use Link Checking Tools", "body": "Free tools like VirusTotal allow you to paste a suspicious link into their website to scan it against multiple security databases and check if it is known to be malicious. Simply copy the link go to the VirusTotal website paste it into the search bar and let the tool scan it against dozens of antivirus engines. Other tools like PhishTank and Google Safe Browsing can also help you identify known phishing sites by checking whether a particular URL has been reported as a scam before."},
                    {"heading": "Report Phishing to the Authorities", "body": "In Indonesia you can report online fraud to the Indonesian Police Cyber Crime unit through their official reporting channels. Banks also have dedicated fraud hotlines that you can call to report suspicious emails or transactions. Reporting these incidents helps protect other potential victims from falling for the same scam. Most email providers like Gmail and Outlook also allow you to report phishing messages directly from your inbox which helps them improve their spam filters for everyone."},
                    {"heading": "Remember", "body": "The best tool for staying safe online is your own caution and awareness. Take your time read carefully and think before you click on anything. Never let anyone rush you into making a decision online no matter how urgent they claim the situation is. Scammers thrive on creating a false sense of urgency so taking that away from them by pausing and thinking first is your strongest defense against phishing attacks."}
                ]
            }
        ]
    },
    # ──────────────────── Module 2 ────────────────────
    {
        "title": "Phishing Prevention — Self-Defense Strategies",
        "level": "BEGINNER",
        "order_index": 2,
        "description": "Implement best practices to prevent phishing. Learn email authentication protocols and practical defensive measures.",
        "duration_mins": 25,
        "articles": [
            {
                "title": "A Practical Approach of Phishing Detection Using Email Header",
                "url": "https://ghafoorazhar.medium.com/a-practical-approach-of-phishing-detection-using-email-header-4a8384c4e681",
                "author": "Azhar Ghafoor",
                "duration_mins": 4,
                "publication_date": "2022-04-27",
                "description": "A practical guide to analyzing email headers for phishing detection.",
                "content": [
                    {"heading": "What Are Email Headers?", "body": "Every email you receive contains hidden information called headers that most people never see. Headers show the complete path that an email took to reach your inbox including every server it passed through along the way. By reading these headers you can determine if an email is really from who it claims to be or if it has been forged by a scammer attempting to deceive you."},
                    {"heading": "How to View Email Headers", "body": "The steps to view email headers vary slightly depending on which email provider you use. In Gmail open the email click the three dots menu button and select Show original to see the full header information. In Outlook open the email click the arrow next to Reply and then select View message details. On Yahoo Mail click More and then View raw message. Each email provider has a way to reveal this information and once you know where to look it takes only a few seconds."},
                    {"heading": "What To Look For in Email Headers", "body": "Start by checking the From field carefully because scammers can easily change the display name you see but the real sender address in the header reveals the truth. Next look at the Reply-To field because sometimes the visible From address looks normal but the Reply-To address is completely different. If you reply your message will go to the scammer not the person you think you are writing to. Finally check the SPF, DKIM, and DMARC results which are security checks that email systems automatically run on incoming messages. If any of these show FAIL or SOFTFAIL the email is very likely to be fake and should be treated with extreme caution."},
                    {"heading": "Understanding SPF, DKIM, and DMARC", "body": "SPF which stands for Sender Policy Framework checks whether the sending server is authorized to send emails on behalf of that domain. DKIM or DomainKeys Identified Mail uses a digital signature to verify that the content of the email has not been tampered with during transit. DMARC which stands for Domain-based Message Authentication Reporting and Conformance tells receiving email servers what to do if the SPF or DKIM checks fail such as quarantining the message or rejecting it entirely. When all three security checks pass you can be much more confident that the email is legitimate."},
                    {"heading": "Simple Rule to Follow", "body": "If an email looks suspicious in any way take a moment to check its headers before responding or clicking anything. If the SPF, DKIM, or DMARC security checks have failed delete the email immediately and do not engage with it further. Learning to read and interpret email headers takes a little bit of practice but it is one of the most reliable and technical ways to spot fake emails that might otherwise look convincing."}
                ]
            }
        ]
    },
    # ──────────────────── Module 3 ────────────────────
    {
        "title": "Social Engineering — Psychological Manipulation",
        "level": "INTERMEDIATE",
        "order_index": 3,
        "description": "Understand social engineering techniques and psychological manipulation. Improve awareness of more sophisticated scam scenarios.",
        "duration_mins": 30,
        "articles": [
            {
                "title": "How to Prevent Social Engineering Attacks",
                "url": "https://ip-specialist.medium.com/how-to-prevent-social-engineering-attacks-1b761e4c82ca",
                "author": "IPSpecialist",
                "duration_mins": 6,
                "publication_date": "2023-02-27",
                "description": "A comprehensive overview of social engineering attacks with a focus on defense mechanisms.",
                "content": [
                    {"heading": "What Is Social Engineering?", "body": "Social engineering is a type of attack where a scammer tricks you into giving them sensitive information or access by manipulating your emotions and trust. Instead of hacking into computer systems they hack into people by exploiting natural human behaviors like the desire to help others or the fear of getting into trouble. This makes social engineering one of the most dangerous types of cyber attacks because it targets human nature rather than technical weaknesses that can be patched with software updates."},
                    {"heading": "Why Social Engineering Works So Well", "body": "Social engineering works because it exploits natural human emotions such as trust, fear, curiosity, and the genuine desire to help others who seem to be in need. Scammers know that most people are generally good and want to be helpful when someone asks for assistance. They use this knowledge against you by creating believable stories that trigger an emotional response making you more likely to act without thinking critically about the situation."},
                    {"heading": "Common Social Engineering Tactics Used by Scammers", "body": "One common tactic is pretending to be someone you trust such as calling you while pretending to be from your bank, the police, or a family member who is in trouble and needs money urgently. Another tactic is creating a strong sense of urgency by saying things like your account will be frozen in one hour or someone is using your identity right now to steal your money. They want you to panic and act without thinking because they know that a calm rational person would see through their lies. Some scammers even spend days or weeks building false trust by becoming your friend online through social media and then eventually making up a sad story about needing financial help."},
                    {"heading": "Real-World Examples of Social Engineering", "body": "A very common social engineering attack is the grandparent scam where someone calls an elderly person pretending to be their grandchild who is in trouble and needs money sent immediately. Another example is fake tech support calls where the scammer claims your computer has a virus and asks you to give them remote access so they can fix it, but instead they steal your files and personal information. In the workplace scammers might pose as IT staff and call employees asking them to reveal their passwords for a system update or security check."},
                    {"heading": "How To Protect Yourself From Social Engineering", "body": "Always verify a person identity before sharing any information. If someone calls you claiming to be from your bank hang up the phone and call your bank official number directly using a number you know is real not the number the caller gave you. Never share your PIN, password, or OTP with anyone who calls, emails, or messages you because your bank will never ask for these through those channels. Trust your instincts because if a situation feels wrong or makes you uncomfortable it probably is a scam. Stop take a deep breath and think carefully before taking any action."},
                    {"heading": "Your Key Defense Against Social Engineering", "body": "Remember this simple rule that will protect you in almost every situation: no legitimate organization will ever pressure you to make an immediate decision involving money or personal information. Take your time to think things through verify the request independently using contact information you find yourself and never let anyone rush you into making a decision that you might regret later."}
                ]
            }
        ]
    },
    # ──────────────────── Module 4 ────────────────────
    {
        "title": "Spear Phishing & Whaling — Targeted Attacks",
        "level": "INTERMEDIATE",
        "order_index": 4,
        "description": "Differentiate between mass phishing, spear phishing, and whaling. Understand the sophistication and targeting strategies of advanced attacks.",
        "duration_mins": 20,
        "articles": [
            {
                "title": "What is a Whaling Attack? Whale Phishing Explained",
                "url": "https://medium.com/@clouddefenseai/what-is-a-whaling-attack-whale-phishing-explained-bc215b0a90a3",
                "author": "CloudDefense.AI",
                "duration_mins": 2,
                "publication_date": "2025-05-02",
                "description": "An in-depth explanation of whaling attacks targeting executives.",
                "content": [
                    {"heading": "What Is Spear Phishing?", "body": "Spear phishing is a highly targeted form of phishing attack where scammers research a specific person or organization before crafting a custom message designed just for them. Instead of sending the same generic fake email to millions of random people hoping someone will fall for it the scammer gathers information about their target from social media company websites and other publicly available sources. The email might include the person real name job title and other personal details to make it look much more legitimate and convincing than a typical mass phishing email."},
                    {"heading": "What Is Whaling?", "body": "Whaling is a specific type of spear phishing attack that targets senior executives such as CEOs, company directors, or business owners who have access to large amounts of money and sensitive corporate data. These high-value targets are called whales in reference to the idea that catching one big fish is worth more than catching many small ones. A successful whaling attack can result in financial losses of millions of dollars and the exposure of highly confidential company information that could damage the entire organization."},
                    {"heading": "How Whaling Attacks Work in Practice", "body": "The attack begins with research where the scammer studies the target by looking at their social media profiles, company website, and news articles to learn about their role, their contacts, their daily activities, and even their travel schedule. Next they craft a fake email that appears to come from a trusted partner, a government agency, or another executive within the same company. The email typically requests an urgent payment or the sharing of sensitive information. Unlike regular phishing emails whaling messages are carefully written without any spelling mistakes or obvious red flags. They use real names, real project references, and realistic language to make the email look completely authentic."},
                    {"heading": "Famous Whaling Attack Examples You Should Know", "body": "One of the most well known whaling attacks happened to Snapchat in 2016 when an employee in the payroll department received a fake email that appeared to be from the CEO asking for payroll information. The attacker tricked the employee into disclosing confidential salary data of all employees. Another major example is the 2015 Ubiquiti Networks attack where scammers impersonated company executives and tricked finance department staff into transferring over 40 million dollars to fraudulent bank accounts controlled by the attackers. These examples show just how devastating whaling attacks can be."},
                    {"heading": "How To Stay Safe From Whaling Attacks", "body": "Companies should implement a policy requiring at least two people to approve any large money transfers so that no single employee can be tricked into authorizing a fraudulent payment alone. Always verify unusual requests by confirming with the person directly through a phone call or in person conversation using contact information you already have not the details provided in the suspicious email. Limit what you and your company share publicly online because the less information scammers can find about you the harder it becomes for them to create convincing targeted attacks."},
                    {"heading": "The Bottom Line on Whaling", "body": "Whaling attacks are particularly dangerous because they are so well crafted and convincing. They do not look like typical scams with obvious spelling mistakes or strange sender addresses. Always verify any request involving money or sensitive information especially when the request comes from senior executives or demands urgent action without giving you time to think and confirm."}
                ]
            }
        ]
    },
    # ──────────────────── Module 5 ────────────────────
    {
        "title": "Advanced Threats — Malware & Zero-Day Exploits",
        "level": "ADVANCED",
        "order_index": 5,
        "description": "Understand malware concepts, zero-day exploits, and advanced threats. Learn about the zero-day vulnerability lifecycle and detection methods.",
        "duration_mins": 35,
        "articles": [
            {
                "title": "Zero-Day Exploits: A Deep Dive into the Unknown Threat",
                "url": "https://medium.com/@zyadaynshtain/zero-day-exploits-a-deep-dive-into-the-unknown-threat-d1eed5f9ac74",
                "author": "Ziad Tamer",
                "duration_mins": 6,
                "publication_date": "2025-10-24",
                "description": "An in-depth explanation of the zero-day lifecycle, detection challenges, and layered defense strategies.",
                "content": [
                    {"heading": "What Is Malware and How Does It Work?", "body": "Malware is short for malicious software and it refers to any program or code that is designed to harm your computer, steal your personal data, or spy on your activities without your knowledge. Malware can enter your device through many different channels including email attachments, fake software downloads from untrusted websites, infected USB drives, or even compromised legitimate websites. Once inside your system malware can do anything from showing annoying popup advertisements to silently recording your keystrokes and stealing your banking credentials and passwords."},
                    {"heading": "What Is a Zero-Day Exploit?", "body": "A zero-day exploit is an attack that takes advantage of a security flaw or vulnerability in software that the developer does not yet know about. Because the software maker has had zero days to create and release a fix before the exploit is discovered by attackers these types of attacks are extremely dangerous and difficult to defend against. Organizations and individuals are completely vulnerable until the software vendor becomes aware of the issue and releases an update to patch the security hole."},
                    {"heading": "Common Types of Malware You Should Know", "body": "Viruses are programs that attach themselves to clean files and spread to other files and computers when you share infected documents or run infected programs. Trojans pretend to be useful or legitimate software such as a free game or utility but secretly steal your data or give attackers access to your computer. Spyware runs quietly in the background watching what you do online, capturing your passwords, and sending this information to scammers. Ransomware is one of the most dangerous types because it locks your files and demands payment to unlock them often causing permanent data loss even if you pay."},
                    {"heading": "How Zero-Day Exploits Are Discovered by Researchers", "body": "Zero-day exploits are discovered through several different channels. Ethical security researchers find them by carefully analyzing software code and testing for unusual behavior and they typically report these vulnerabilities to the software vendor so they can be fixed before criminals find them. Unfortunately cybercriminals use similar techniques to discover the same vulnerabilities but instead of reporting them they use them to launch attacks against unsuspecting victims. Sometimes a zero-day exploit is only discovered after it has already been actively used in attacks for weeks or even months which is why using multiple layers of security protection is so important."},
                    {"heading": "How To Defend Against Malware Effectively", "body": "Install reliable antivirus and anti-malware software from a trusted provider and keep it updated so it can detect the latest threats. Keep your operating system and all your applications updated because software updates often include important security patches that fix known vulnerabilities. Never download files from untrusted or suspicious sources and be very careful with email attachments even when they appear to come from people you know because their accounts may have been compromised. Back up your important files regularly to an external drive or cloud storage service so you can recover your data if you ever become a victim of ransomware or another destructive attack."},
                    {"heading": "Remember This Important Point", "body": "No antivirus software can catch every single threat because new malware is created every single day. Your best defense is developing good digital habits including being careful about what you click and download, staying informed about new types of threats, and updating your software promptly whenever security patches are released by the developers."}
                ]
            }
        ]
    },
    # ──────────────────── Module 6 ────────────────────
    {
        "title": "Ransomware Fundamentals — Understanding & Preventing",
        "level": "ADVANCED",
        "order_index": 6,
        "description": "Understand ransomware mechanics and attack vectors. Learn best practices for prevention and recovery without paying ransom.",
        "duration_mins": 40,
        "articles": [
            {
                "title": "How to Prevent Ransomware Attacks: Top 10 Best Practices",
                "url": "https://ip-specialist.medium.com/how-to-prevent-ransomware-attacks-top-10-best-practices-7105f6149293",
                "author": "IPSpecialist",
                "duration_mins": 6,
                "publication_date": "2024-12-11",
                "description": "A comprehensive 10-point prevention strategy covering backups, employee training, MFA, email filtering, network segmentation, and incident response planning.",
                "content": [
                    {"heading": "What Is Ransomware and Why Is It Dangerous?", "body": "Ransomware is a dangerous type of malware that locks your files or your entire computer and demands payment to unlock them and restore your access. Scammers usually ask for payment in cryptocurrency like Bitcoin because these transactions are much harder to trace than regular bank transfers. Ransomware attacks have become increasingly common in recent years targeting not just individuals but also major hospitals, schools, government agencies, and large corporations causing massive disruptions and financial losses."},
                    {"heading": "The Growing Threat of Ransomware Worldwide", "body": "Ransomware attacks have increased dramatically in both frequency and severity in recent years. In 2023 a major Indonesian government agency was hit by a devastating ransomware attack that disrupted public services for weeks affecting millions of citizens. Hospitals around the world have been forced to cancel surgeries and turn away patients because their computer systems were locked by ransomware. The average ransom demand has risen to hundreds of thousands of dollars and the total damage including downtime, recovery costs, and reputational harm goes far beyond the ransom amount itself."},
                    {"heading": "How Ransomware Gets Into Your System", "body": "Ransomware most often enters through phishing emails when someone clicks on a malicious attachment or link contained in a fake email that appears to be from a legitimate source. Another common method is through remote desktop protocol attacks where scammers guess weak or default passwords to access computers remotely over the internet. Fake software downloads are also a major threat because you might download a free program or game that actually contains ransomware hidden inside. Even infected USB drives can spread ransomware when you plug an unknown drive into your computer without scanning it first."},
                    {"heading": "The Ransomware Attack Process Step by Step", "body": "First the ransomware gains access to your system through one of the methods described above such as a phishing email or fake download. Once inside it begins encrypting your files using strong encryption that makes them completely inaccessible without the decryption key held by the attackers. After the encryption is complete the ransomware displays a ransom note on your screen with payment instructions and a deadline. Many modern ransomware attacks also steal sensitive data before encrypting it and threaten to release that data publicly if the ransom is not paid a tactic that is known as double extortion."},
                    {"heading": "What To Do If Ransomware Hits Your Computer", "body": "Do not pay the ransom under any circumstances because there is no guarantee that the attackers will actually unlock your files after receiving payment and paying only encourages them to continue their criminal activities targeting more victims. Immediately disconnect your computer from the internet by unplugging the network cable or turning off Wi-Fi to prevent the ransomware from spreading to other devices on your network. Report the attack to your bank and local authorities so they can investigate and take action against the criminals. If you have backups you can restore your files from those backups without needing to pay anything to the attackers."},
                    {"heading": "Prevention Is the Most Important Defense", "body": "The single most important thing you can do to protect yourself from ransomware is to back up your files regularly and keep at least one backup completely disconnected from your computer such as an external hard drive that you only connect during backup times. This way even if ransomware encrypts your main files your backups remain safe and accessible. Follow the proven 3-2-1 backup rule which means keep three copies of your important data stored on two different types of media with one copy kept offsite in a different physical location for maximum protection against data loss."}
                ]
            }
        ]
    },
    # ──────────────────── Module 7 ────────────────────
    {
        "title": "Incident Response — Responding to Attacks",
        "level": "EXPERT",
        "order_index": 7,
        "description": "Understand the incident response lifecycle and critical actions within the first 24 hours. Master containment, forensics, and recovery procedures.",
        "duration_mins": 45,
        "articles": [
            {
                "title": "Step-By-Step Incident Response Checklist For Ransomware",
                "url": "https://medium.com/@EdwardDiazCISSP/step-by-step-incident-response-checklist-for-ransomware-with-sources-2023-e77b4ca670e5",
                "author": "Edward Diaz",
                "duration_mins": 2,
                "publication_date": "2023-05-22",
                "description": "A checklist with best practices from the FBI and SANS Institute.",
                "content": [
                    {"heading": "What Is Incident Response and Why Does It Matter?", "body": "Incident response is the structured process of handling a security attack or data breach in a way that minimizes damage, reduces recovery time, and prevents the incident from happening again. Having a clear plan ready before an attack ever happens can save you significant amounts of time, money, and stress when a real emergency occurs. A good incident response plan works like a fire drill where everyone in the organization knows exactly what to do, where to go, and who to call when something goes wrong."},
                    {"heading": "Why You Absolutely Need an Incident Response Plan", "body": "Without a well defined incident response plan people panic when an attack happens and they make mistakes under pressure that make the situation worse. With a proper plan in place everyone knows their specific role and responsibilities and can act quickly and effectively to contain and resolve the incident. Studies have shown that organizations with tested incident response plans are able to contain attacks up to 50 percent faster and save millions of dollars in potential damages compared to organizations that have no plan at all."},
                    {"heading": "The Six Phases of the Incident Response Lifecycle", "body": "The SANS Institute which is a trusted authority on cybersecurity defines six key phases of incident response that every organization should follow. The phases are Preparation where you create and document your plan, Identification where you detect and confirm that a security incident has occurred, Containment where you isolate affected systems to prevent the attack from spreading, Eradication where you remove the threat from your systems, Recovery where you restore normal operations from clean backups, and Lessons Learned where you review what happened and improve your defenses for the future."},
                    {"heading": "The First 24 Hours Are Absolutely Critical", "body": "Step one is to identify the problem by confirming that a real security incident has actually occurred and not just a false alarm. Check for unusual activity on your accounts, blocked login attempts, unexpected password changes, or ransom notes appearing on your screen. Step two is to contain the attack by immediately isolating affected computers from the network and changing all passwords. Step three is to gather information by taking screenshots of what you see, saving any error messages, and writing down everything you remember about what happened before the attack started. Step four is to notify the right people including your IT team, your bank, and the relevant authorities. If customer data may have been exposed you may also need to notify affected customers. Step five is to begin the recovery process by cleaning affected systems, restoring data from backups, and carefully verifying that the threat has been completely removed before returning to normal operations."},
                    {"heading": "Practice Your Plan Regularly", "body": "Run practice drills with your team on a regular basis so that everyone knows exactly what to do when a real incident happens without needing to think or hesitate. Practice makes the real response much faster and significantly less stressful for everyone involved. Review and update your incident response plan regularly based on new and emerging threats as well as lessons learned from both drills and any real incidents that occur."},
                    {"heading": "Final Thoughts on Incident Response", "body": "Incident response is not just about having the right technology and tools it is equally about having well trained people and well documented processes that everyone understands and follows. Invest in regular training for your team, build a thorough but clear incident response plan, and practice it consistently. When a real attack eventually happens you will be very glad you took the time to prepare properly."}
                ]
            }
        ]
    },
    # ──────────────────── Module 8 ────────────────────
    {
        "title": "Advanced Detection & Cyber Threat Intelligence",
        "level": "EXPERT",
        "order_index": 8,
        "description": "Understand advanced detection methodologies and Cyber Threat Intelligence (CTI). Master threat hunting and proactive defense strategies.",
        "duration_mins": 50,
        "articles": [
            {
                "title": "Zero-Day Hunting with CTI: How to Predict and Respond to Unknown Threats",
                "url": "https://medium.com/@scottbolen/zero-day-hunting-with-cti-how-to-predict-and-respond-to-unknown-threats-a91b66a146b1",
                "author": "Scott Bolen | RONIN OWL CTI",
                "duration_mins": 5,
                "publication_date": "2025-03-25",
                "description": "An advanced CTI-based approach to zero-day hunting.",
                "content": [
                    {"heading": "What Is Cyber Threat Intelligence (CTI)?", "body": "Cyber Threat Intelligence commonly known as CTI is information about current and potential cyber attacks that helps organizations understand who might attack them, what methods they might use, and how to defend against those threats effectively. CTI turns raw data from various sources such as security logs, incident reports, and dark web monitoring into actionable insights that can guide security decisions and help organizations stay one step ahead of cybercriminals."},
                    {"heading": "Different Types of Threat Intelligence Explained", "body": "Strategic intelligence provides a big picture view of the overall threat landscape and is designed for executives and decision makers who need to understand long term risks and trends. Tactical intelligence focuses on the specific tactics, techniques, and procedures or TTPs used by particular attacker groups to help security teams recognize and defend against known attack patterns. Operational intelligence looks at specific upcoming attacks and campaigns that have been identified through monitoring criminal forums and communication channels. Technical intelligence includes specific indicators of compromise such as malicious IP addresses, fraudulent domain names, and file hashes associated with known malware and phishing campaigns."},
                    {"heading": "Why Cyber Threat Intelligence Matters for Everyone", "body": "Knowing about emerging threats before they actually reach you gives you valuable time to prepare and strengthen your defenses. If security researchers discover a new phishing scam that is specifically targeting banks in your region your bank can warn customers in advance and implement additional security measures to block those attacks. CTI enables a proactive approach to security rather than simply reacting to incidents after they have already caused damage."},
                    {"heading": "Simple Ways To Stay Informed About Cyber Threats", "body": "Follow trusted sources of cybersecurity information such as government agencies that publish alerts about new and emerging threats. In Indonesia you can follow the National Cyber and Crypto Agency known as BSSN and the National Police Cyber Crime unit for official alerts and guidance. Use threat sharing platforms where banks and security companies share information about attacks they have observed so that everyone in the community can benefit from shared knowledge and stay protected. Monitor your own accounts by checking your bank statements regularly and setting up transaction notifications so that the sooner you spot any unusual activity on your accounts the faster you can respond to stop it."},
                    {"heading": "What Is Threat Hunting and Why Is It Important?", "body": "Threat hunting is the practice of proactively searching for hidden threats that may have already bypassed your existing security defenses and are operating undetected inside your systems. Instead of simply waiting for automated security tools to generate alerts threat hunters actively look for subtle signs of compromise using their knowledge of attacker behavior and the latest intelligence about emerging threats. This proactive approach has become essential as attackers become more sophisticated at evading traditional detection methods such as antivirus software and firewalls."},
                    {"heading": "Take Action and Stay Ahead of Threats", "body": "Being proactive about your security rather than waiting for something bad to happen is the best approach you can take to protect yourself online. Stay curious about new types of scams and threats, keep learning about how to recognize them, and never assume that you are too small or unimportant to be a target of cybercriminals. The more you know about potential threats and how they work the better prepared you will be to defend against them and protect your personal information and finances."}
                ]
            }
        ]
    }
]

# ── Seeder ─────────────────────────────────────────────────────────

def seed_education_data(db: Session, force: bool = False):
    """Seed education modules and articles.

    If force=True, existing data is deleted first and re-seeded.
    Otherwise, skips if education data already exists.
    """
    existing_count = db.query(EducationModule).count()
    if existing_count > 0 and not force:
        print("[Seed] Education data already exists, skipping.")
        return

    if force and existing_count > 0:
        print("[Seed] Force re-seeding — clearing existing education data...")
        db.query(EducationArticle).delete()
        db.query(EducationModule).delete()
        db.commit()

    print("[Seed] Seeding education modules and articles...")
    img_iter = iter(ARTICLE_IMAGES_ORDERED)

    for module_data in EDUCATION_MODULES_DATA:
        data = module_data.copy()
        articles_data = data.pop("articles")
        order = data["order_index"]
        data["image_url"] = MODULE_IMAGES.get(order)
        module = EducationModule(**data)
        db.add(module)
        db.flush()

        for idx, article_data in enumerate(articles_data, start=1):
            content_list = article_data.pop("content", [])
            article_data["image_url"] = next(img_iter, None)
            article_data["content"] = content_list if content_list else None
            if "order_index" not in article_data:
                article_data["order_index"] = idx
            article = EducationArticle(module_id=module.id, **article_data)
            db.add(article)

    db.commit()
    print("[Seed] Education data seeded successfully!")

import { IMenuItem } from "@/types";

export const footerDetails: {
    subheading: string;
    quickLinks: IMenuItem[];
    email: string;
    telephone: string;
} = {
    subheading: "Keep Tabs on All of Your Expenses in One Place Now!",
    quickLinks: [
        {
            text: "Login",
            url: "/login"
        }
    ],
    email: 'contact@trackexpenses.uk',
    telephone: '+44 7588 779657',
}

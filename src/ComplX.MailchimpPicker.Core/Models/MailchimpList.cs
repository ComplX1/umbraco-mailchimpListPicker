using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ComplX.MailchimpPicker.Core
{
    public class MailchimpList
    {
        public string ID { get; set; }
        public string Name { get; set; }
        public string CssClass => "icon umb-tree-icon " + Icon;
        public string Icon => "mailchimplistpicker-mailchimp";

        public MailchimpMetaData MetaData = new MailchimpMetaData()
        {
            IsContainer = false
        };
    }

    public class MailchimpMetaData
    {
        public bool IsContainer { get; set; }
    }
}

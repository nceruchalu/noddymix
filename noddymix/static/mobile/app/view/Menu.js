Ext.define('NoddyMix.view.Menu', {
    extend: 'Ext.Panel',
    xtype: 'menu',
    
    requires: [
        'Ext.List'
    ],
    
    config: {
        layout: 'fit',
        width: 171,
        height:90, // 45 * number of items
        padding:0,
        right:8,
        top:51,
        hidden:true,
        cls:'menu',
        modal: true,
        hideOnMaskTap:true,
        
        items: [{
            xtype:'list',
            store:'MenuItems',
            itemHeight:40,
            itemTpl: new Ext.XTemplate(
                '<tpl if="iconCls">',
                '  <span class="x-button x-button-plain">',
                '    <span class="x-button-icon x-shown {iconCls}"></span>',
                '  </span>',
                '</tpl>',
                '<span class="text">{title}</span>'),
            scrollable: false,
            height:'100%'
        }]
    }
});
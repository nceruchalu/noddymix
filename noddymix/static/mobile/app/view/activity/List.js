Ext.define('NoddyMix.view.activity.List', {
    extend: 'Ext.dataview.List',
    xtype: 'activities',
    
    config: {
        store:'Activities',
        cls:'activities',
        scrollable:false,
        height:100,
        itemTpl: new Ext.XTemplate(
            '<div class="icon-container">',
            '    <div class="left-half"></div>',
            '    <span class="x-button x-button-plain">',
            '        <span class="x-button-icon x-shown {verb}"></span>',
            '    </span>',
            '    <span class="triangle-left"></span>',
            '</div>',
            '<div class="text">',
            '    <p>',
            '        <span class="verb">{verb}</span> ',
            '        <tpl if="object">',
            '            <span class="highlight">{object}</span> ',
            '            <tpl if="target">to </tpl>',
            '        </tpl>',
            '        <tpl if="target">',
            '            <span class="highlight">{target}</span> ',
            '        </tpl>',
            '    </p>',
            '    <p class="timesince">{timesince} ago</p>',
            '</div>'
        )
    }
});
Ext.define('NoddyMix.view.audio.Audio', {
    extend:'Ext.Audio',
    xtype:'audio-noddymix',
    
    initialize: function() {
        this.callParent();
                
        this.addMediaListener({
            playing:'onPlaying'
        });
    },
    
    onPlaying: function() {
        this.fireEvent('playing', this);
    },
    
    template: Ext.os.is.Android ? [{
        reference: 'media',
        preload: 'metadata',
        autoplay:'autoplay',
        tag: 'audio',
        cls: Ext.baseCSSPrefix + 'component'
    }] : [{
        reference: 'media',
        preload: 'auto',
        tag: 'audio',
        cls: Ext.baseCSSPrefix + 'component'
    }],
    
    config: {
        enableControls:false,
        hidden:true
    }
});
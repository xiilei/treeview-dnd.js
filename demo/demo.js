define(function(require, exports, module) {
    var J = require('jquery');
    var Dnd = require('../treeview-dnd');
    
    //Dnd.levelsAttr存储默认数据
    //J.extend({},Dnd.levelsAttr[level-1])
    var data = [
        {
           attrs:{id:''},
           children:[
               {
                    attrs:{id:''},
                    cls:'item-labelbox',
                    title:'二级节点1',
                    children:[
                        {
                           attrs:{id:''},
                           cls:'item-labelbox',
                           title:'三级节点1-1'
                        },
                        {
                           attrs:{id:''},
                           cls:'item-labelbox',
                           title:'三级节点1-2'
                        }
                    ]
               }
           ],
           cls:'item-labelbox',
           title:'一级节点1'
        },
        {
           attrs:{id:''},
           children:[
               {
                    attrs:{id:''},
                    cls:'item-labelbox',
                    title:'二级节点2',
                    children:[
                        {
                           attrs:{id:''},
                           cls:'item-labelbox',
                           title:'三级节点2-1'
                        },
                        {
                           attrs:{id:''},
                           cls:'item-labelbox',
                           title:'三级节点2-2'
                        }
                    ]
               }
           ],
           cls:'item-labelbox',
           title:'一级节点2'
        }
    ];
    
    Dnd.levelsAttr[1]['icon'] = '<span class="label-icon label-icon-2 expand-icon">∨</span>';
    Dnd.render(data,J('#treeview_id'),{'controls':'<button type="button" class="btn btn-default btn-sm delete">删除</button>'});
    
    var events = {
        'click':function(e){
            var _this = J(this);
            var handle = e.data.handle;
            var _dnd = e.data.dnd;
            if(!handle['selectCls']){
                return false;
            }
            if(_dnd._lastSelected){
                _dnd._lastSelected.removeClass(handle['selectCls']);
                _dnd._lastSelected = null;
            }
            _this.addClass(handle['selectCls']);
            _dnd._lastSelected = _this;
        }
    };
    
    Dnd.dragabled('.item-labelbox',{
        'targetCls':'dragging-target',
        'draggingCls':'dragging',
        'draghoverCls':'dragging-over',
        'selectCls':'selected',//这个是自定义的
        'drag':function(){

        },
        //'drop':null,
        'dropabled':true, //drop没有分组的概念
        'events':events
    });

    Dnd.dragabled('.select-labelbox',{
        'targetCls':'dragging-target',
        'draggingCls':'dragging',
        'draghoverCls':'dragging-over',     
        'drag':function(){

        },
        //drop,当指定了drop之后默认drop就会失效,必须自己append
        'drop':function(type,target,hit){
            if(type!='after'&&type!='insert'){
                return false;
            }
            var dom = this.createNewLevel(target.dndlevel);
            switch(type){
                case 'after':
                    if(dom) hit.parent().after(dom);
                    break;
                case 'insert':
                    hit.siblings('ul').append(dom);
                    break;
            } 
            var target = dom.children('.item-labelbox');
            this.addItem('.item-labelbox',target);
            if(target.dndlevel==='2'){
                bindexpand(target.find('.expand-icon'),target.siblings('ul'));
            }
            bindHover(target);
        }
    });
    
    var _items = Dnd.getDropItems(),i=0;
    for(;i<_items.length;i++){
        bindHover(_items[i]);
        bindexpand(_items[i].find('.expand-icon'),_items[i].siblings('ul'));
    }   
    
    function bindHover(target){
        if(!target)return false;
        var del = target.find('.delete');
        del.bind('click',{dnd:Dnd,target:target},function(e){
            e.stopPropagation();
            e.preventDefault();
            //维护drop
            e.data.dnd.removeItem(e.data.target);
        });
        target.hover(function(e){
            var _this = J(this);
            _this.addClass('expand-header-hover').data('control-delete').show();
        },function(e){
            var _this = J(this);
            _this.removeClass('expand-header-hover').data('control-delete').hide();
        }).data('control-delete',del);
    }
    
    function bindexpand(icon,targetUl){
        if(!targetUl || !icon){
            return false;
        }
        icon.bind('click',{tu:targetUl},function(e){
            e.stopPropagation();
            e.preventDefault();
            var tu = e.data.tu;
            if(tu.css('display') != 'none'){
                tu.hide();
                J(this).text('>').addClass('glyphicon-chevron-right');
                Dnd.updateArea();
            }else{
                tu.show();
                J(this).text('∨').removeClass('glyphicon-chevron-right');
                Dnd.updateArea();
            }
        });
    }
})
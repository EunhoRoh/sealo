package com.sealo.domain.shop;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sealo.domain.member.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ShopApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    MemberRepository memberRepository;

    /** 시드 카탈로그의 가장 싼 아이템(50조개) id를 얻는다 */
    private long cheapestItemId() throws Exception {
        String body = mockMvc.perform(get("/api/shop/items"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get(0).get("id").asLong();
    }

    private void giveShells(int amount) {
        // 도장 없이 잔액을 만들 수단이 없으므로 테스트에서 직접 지급
        memberRepository.findById(1L).orElseThrow().earnShells(amount);
    }

    @Test
    void 카탈로그를_조회하면_시드_아이템이_보인다() throws Exception {
        mockMvc.perform(get("/api/shop/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].owned").value(false));
    }

    @Test
    void 조개가_충분하면_구매된다() throws Exception {
        giveShells(100);
        long itemId = cheapestItemId();

        mockMvc.perform(post("/api/shop/items/" + itemId + "/purchase"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paidShells").value(50))
                .andExpect(jsonPath("$.shellBalance").value(50));

        mockMvc.perform(get("/api/shop/items"))
                .andExpect(jsonPath("$[0].owned").value(true));
    }

    @Test
    void 조개가_부족하면_409() throws Exception {
        long itemId = cheapestItemId();

        mockMvc.perform(post("/api/shop/items/" + itemId + "/purchase"))
                .andExpect(status().isConflict());
    }

    @Test
    void 같은_아이템은_두_번_살_수_없다() throws Exception {
        giveShells(200);
        long itemId = cheapestItemId();

        mockMvc.perform(post("/api/shop/items/" + itemId + "/purchase"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/shop/items/" + itemId + "/purchase"))
                .andExpect(status().isConflict());
    }

    @Test
    void 착용하면_같은_카테고리_기존_착용은_해제된다() throws Exception {
        giveShells(200);
        String body = mockMvc.perform(get("/api/shop/items"))
                .andReturn().getResponse().getContentAsString();
        long first = objectMapper.readTree(body).get(0).get("id").asLong();
        long second = objectMapper.readTree(body).get(1).get("id").asLong();

        mockMvc.perform(post("/api/shop/items/" + first + "/purchase")).andExpect(status().isCreated());
        mockMvc.perform(post("/api/shop/items/" + second + "/purchase")).andExpect(status().isCreated());

        mockMvc.perform(post("/api/shop/items/" + first + "/equip")).andExpect(status().isOk());
        mockMvc.perform(post("/api/shop/items/" + second + "/equip")).andExpect(status().isOk());

        mockMvc.perform(get("/api/shop/items"))
                .andExpect(jsonPath("$[0].equipped").value(false))
                .andExpect(jsonPath("$[1].equipped").value(true));
    }

    @Test
    void 보유하지_않은_아이템은_착용할_수_없다() throws Exception {
        long itemId = cheapestItemId();

        mockMvc.perform(post("/api/shop/items/" + itemId + "/equip"))
                .andExpect(status().isNotFound());
    }
}

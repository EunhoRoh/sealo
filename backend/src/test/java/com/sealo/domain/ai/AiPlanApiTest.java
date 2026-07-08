package com.sealo.domain.ai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sealo.domain.member.MemberRepository;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AiPlanApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    MemberRepository memberRepository;

    private String readingRequest() throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "type", "READING",
                "answers", Map.of("book", "마션", "pages", "480")
        ));
    }

    @Test
    void 첫_요청은_무료로_플랜이_생성된다() throws Exception {
        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(readingRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.freeUsed").value(true))
                .andExpect(jsonPath("$.paidShells").value(0))
                .andExpect(jsonPath("$.plan.theme").value("READING"))
                .andExpect(jsonPath("$.plan.items.length()").value(org.hamcrest.Matchers.greaterThan(2)));
    }

    @Test
    void 두번째부터는_조개가_부족하면_409() throws Exception {
        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(readingRequest()))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(readingRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    void 두번째_요청은_조개_300개가_차감된다() throws Exception {
        memberRepository.findById(1L).orElseThrow().earnShells(500);

        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(readingRequest()))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(readingRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.freeUsed").value(false))
                .andExpect(jsonPath("$.paidShells").value(300))
                .andExpect(jsonPath("$.shellBalance").value(200));
    }

    @Test
    void 세안은_레티놀과_비타민C_궁합을_배치한다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "SKINCARE",
                "answers", Map.of("products", "레티놀,비타민C,선크림")
        ));

        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.plan.items[?(@.name =~ /.*궁합.*/)]").exists());
    }

    @Test
    void 지원하지_않는_타입은_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("type", "COOKING", "answers", Map.of()));

        mockMvc.perform(post("/api/ai/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
